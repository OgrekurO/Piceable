<template>
  <div class="graph-canvas" ref="containerRef" :style="{ cursor: isPlacingNode ? 'crosshair' : 'default' }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import * as d3 from 'd3';

// Types
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type?: string;
  image?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  [key: string]: any;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
  curvature?: number; // 0 to 1
  [key: string]: any;
}

const props = defineProps<{
  data: { nodes: GraphNode[], links: GraphLink[] },
  config: any,
  selectedLink?: GraphLink | null,
  isPlacingNode?: boolean
}>();

const emit = defineEmits(['node-click', 'link-click', 'background-click', 'node-drag-end', 'link-change']);

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
let transform = d3.zoomIdentity;
let width = 0;
let height = 0;

// Image Cache
const imageCache = new Map<string, HTMLImageElement>();

// Color Scale
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Load Image Helper
const loadImage = (url: string): HTMLImageElement | null => {
  if (imageCache.has(url)) return imageCache.get(url)!;
  
  const img = new Image();
  img.src = url;
  img.onload = () => {
    // Re-render when image loads
    requestAnimationFrame(render);
  };
  imageCache.set(url, img);
  return img;
};

// Initialize Graph
const initGraph = () => {
  if (!containerRef.value || !canvasRef.value) return;

  width = containerRef.value.clientWidth;
  height = containerRef.value.clientHeight;

  const canvas = canvasRef.value;
  canvas.width = width;
  canvas.height = height;

  // Zoom Behavior
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.1, 8])
    .on('zoom', (event) => {
      transform = event.transform;
      requestAnimationFrame(render);
    });

  // Drag Behavior
  const drag = d3.drag<HTMLCanvasElement, unknown>()
    .subject(dragSubject)
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded);

  d3.select(canvas)
    .call(drag)
    .call(zoom)
    .on('dblclick.zoom', null); // Disable double click zoom

  // Click Handling
  d3.select(canvas).on('click', handleClick);
  
  // Hover Handling
  d3.select(canvas).on('mousemove', handleMouseMove);

  // Custom boundary force to keep nodes within a circular boundary
  const boundaryForce = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height)/1.2 - 50; // Leave 50px margin
    
    props.data.nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;
      
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If node is outside the boundary, push it back
      if (distance > radius) {
        const angle = Math.atan2(dy, dx);
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
        // Dampen velocity when hitting boundary
        if (node.vx) node.vx *= 0.5;
        if (node.vy) node.vy *= 0.5;
      }
    });
  };

  // Pre-calculate node radii for performance
  calculateNodeRadii();

  // Simulation
  simulation = d3.forceSimulation<GraphNode, GraphLink>(props.data.nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(props.data.links).id(d => d.id))
    .force('charge', d3.forceManyBody().strength(props.config.forceStrength || -2))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(props.config.centerForce || 1))
    .force('collide', d3.forceCollide<GraphNode>()
      .radius(node => {
        // Collision radius = node radius * 2 (diameter * 2)
        const nodeRadius = getNodeRadius(node);
        const multiplier = props.config.collideRadius ? props.config.collideRadius / 40 : 1;
        return nodeRadius * 2 * multiplier;
      })
      .strength(props.config.collideStrength || 0.1))
    .force('boundary', boundaryForce); // Add boundary force

  simulation.on('tick', () => {
    // Only render if physics is enabled
    if (props.config.physicsEnabled) {
      requestAnimationFrame(render);
    }
  });
  
  // If physics is disabled initially, stop the simulation
  if (!props.config.physicsEnabled) {
    simulation.stop();
    // Fix all nodes in place
    props.data.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        node.fx = node.x;
        node.fy = node.y;
      }
    });
  }
  
  // Force initial render
  requestAnimationFrame(render);
};

// Render Loop
const render = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  // Draw Links
  props.data.links.forEach(link => drawLink(ctx, link));

  // Draw Nodes
  props.data.nodes.forEach(node => drawNode(ctx, node));

  ctx.restore();
};

// Pre-calculate and cache node radii for performance
const calculateNodeRadii = () => {
  if (!props.config.nodeSizeByLinks) {
    // If not using link-based sizing, set all to default
    props.data.nodes.forEach(node => {
      (node as any)._radius = 20;
    });
    return;
  }
  
  // Build a map of node ID to link count for O(m) complexity
  const linkCountMap = new Map<string, number>();
  props.data.nodes.forEach(node => linkCountMap.set(node.id, 0));
  
  props.data.links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    linkCountMap.set(sourceId, (linkCountMap.get(sourceId) || 0) + 1);
    linkCountMap.set(targetId, (linkCountMap.get(targetId) || 0) + 1);
  });
  
  // Find max link count
  const maxLinks = Math.max(...Array.from(linkCountMap.values()), 1);
  
  // Calculate radius for each node
  const minRadius = props.config.minNodeRadius || 15;
  const maxRadius = props.config.maxNodeRadius || 40;
  
  props.data.nodes.forEach(node => {
    const linkCount = linkCountMap.get(node.id) || 0;
    const ratio = linkCount / maxLinks;
    (node as any)._radius = minRadius + (maxRadius - minRadius) * ratio;
  });
};

// Get node radius (from cache)
const getNodeRadius = (node: GraphNode): number => {
  return (node as any)._radius || 20;
};

// Draw Node
const drawNode = (ctx: CanvasRenderingContext2D, node: GraphNode) => {
  if (node.x === undefined || node.y === undefined) return;

  const r = getNodeRadius(node);
  
  // Draw Circle Base
  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
  ctx.fillStyle = props.config.nodeColorBy ? colorScale(node[props.config.nodeColorBy] || 'Unknown') : '#ccc';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw Image
  if (props.config.showImages && node.image) {
    const img = imageCache.get(node.image);
    if (img && img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(img, node.x - r, node.y - r, r * 2, r * 2);
      ctx.restore();
    } else {
      loadImage(node.image);
    }
  }

  // Draw Label
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText(node.label, node.x + r + 4, node.y + 4);
};

// Draw Link
const drawLink = (ctx: CanvasRenderingContext2D, link: GraphLink) => {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;
  
  if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return;

  ctx.beginPath();
  
  // Handle Curvature (Quadratic Bezier)
  if (link.curvature) {
    // Calculate control point
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const cx = (source.x + target.x) / 2 - dy * link.curvature;
    const cy = (source.y + target.y) / 2 + dx * link.curvature;
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(cx, cy, target.x, target.y);
  } else {
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
  }

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;
  
  // Highlight selected link
  if (props.selectedLink === link) {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
  }

  if (link.Direction === 'undirected') {
    ctx.setLineDash([5, 5]);
  } else {
    ctx.setLineDash([]);
  }
  
  ctx.stroke();
  ctx.setLineDash([]);

  if (link.Direction !== 'undirected') {
    drawArrow(ctx, source, target, link.curvature);
  }

  // Draw Control Point if selected
  if (props.selectedLink === link) {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    if (source.x !== undefined && target.x !== undefined && source.y !== undefined && target.y !== undefined) {
      let cx, cy;
      if (link.curvature) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        cx = (source.x + target.x) / 2 - dy * link.curvature;
        cy = (source.y + target.y) / 2 + dx * link.curvature;
      } else {
        cx = (source.x + target.x) / 2;
        cy = (source.y + target.y) / 2;
      }
      
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
};

const drawArrow = (ctx: CanvasRenderingContext2D, source: GraphNode, target: GraphNode, curvature?: number) => {
  if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return;
  
  // Calculate angle at target
  let angle;
  if (curvature) {
     const dx = target.x - source.x;
     const dy = target.y - source.y;
     const cx = (source.x + target.x) / 2 - dy * curvature;
     const cy = (source.y + target.y) / 2 + dx * curvature;
     angle = Math.atan2(target.y - cy, target.x - cx);
  } else {
     angle = Math.atan2(target.y - source.y, target.x - source.x);
  }

  const r = 20 + 2; // Node radius + padding
  const x = target.x - Math.cos(angle) * r;
  const y = target.y - Math.sin(angle) * r;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10 * Math.cos(angle - Math.PI / 6), y - 10 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - 10 * Math.cos(angle + Math.PI / 6), y - 10 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = '#999';
  ctx.fill();
};

// Interaction Helpers
function dragSubject(event: any) {
  if (props.isPlacingNode) return null;

  // Use d3.pointer for consistent coordinates relative to canvas
  const [mx, my] = d3.pointer(event, canvasRef.value);
  const x = transform.invertX(mx);
  const y = transform.invertY(my);
  
  // Check Control Point for Selected Link first
  if (props.selectedLink) {
    const link = props.selectedLink;
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    if (source.x !== undefined && target.x !== undefined && source.y !== undefined && target.y !== undefined) {
      let cx, cy;
      if (link.curvature) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        cx = (source.x + target.x) / 2 - dy * link.curvature;
        cy = (source.y + target.y) / 2 + dx * link.curvature;
      } else {
        cx = (source.x + target.x) / 2;
        cy = (source.y + target.y) / 2;
      }
      
      if (Math.hypot(x - cx, y - cy) < 10) {
        return { type: 'control-point', link, x: cx, y: cy };
      }
    }
  }

  // Find node
  let subject: any = null;
  let minDist = 30; // Hit radius
  
  for (const node of props.data.nodes) {
    if (node.x === undefined || node.y === undefined) continue;
    const dist = Math.hypot(x - node.x, y - node.y);
    if (dist < minDist) {
      minDist = dist;
      subject = node;
    }
  }
  
  if (subject) {
    // Important: D3 drag expects the subject to have x and y properties
    // We return the node itself, but we need to ensure it tracks properly
    // The 'x' and 'y' returned here are the *start* coordinates of the drag subject
    // but D3 uses them to calculate dx/dy.
    // Actually, returning the node object is standard for force simulation drag.
    return subject;
  }
  
  return null;
}

function dragStarted(event: any) {
  if (props.isPlacingNode) return;
  if (event.subject.type === 'control-point') {
    return;
  }
  
  if (!event.active && props.config.physicsEnabled) {
    simulation?.alphaTarget(0.3).restart();
  }
  
  // Use d3.pointer to get accurate coordinates
  const [mx, my] = d3.pointer(event, canvasRef.value);
  event.subject.fx = transform.invertX(mx);
  event.subject.fy = transform.invertY(my);
}

function dragged(event: any) {
  if (props.isPlacingNode) return;

  if (event.subject.type === 'control-point') {
    const link = event.subject.link;
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    
    const [mx, my] = d3.pointer(event, canvasRef.value);
    const x = transform.invertX(mx);
    const y = transform.invertY(my);
    
    if (source.x === undefined || target.x === undefined || source.y === undefined || target.y === undefined) return;
    
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.hypot(dx, dy);
    
    if (len > 0) {
      const k = ((x - midX) * (-dy) + (y - midY) * dx) / (len * len);
      link.curvature = k;
      emit('link-change', link);
      requestAnimationFrame(render);
    }
    return;
  }

  // Use d3.pointer to get accurate coordinates
  const [mx, my] = d3.pointer(event, canvasRef.value);
  event.subject.fx = transform.invertX(mx);
  event.subject.fy = transform.invertY(my);
  
  // Force render during drag
  requestAnimationFrame(render);
}

function dragEnded(event: any) {
  if (props.isPlacingNode) return;
  if (event.subject.type === 'control-point') return;

  if (!event.active && props.config.physicsEnabled) simulation?.alphaTarget(0);
  
  // Always pin the node after dragging (set fx/fy to current position)
  // This allows manual layout even when physics is enabled
  const [mx, my] = d3.pointer(event, canvasRef.value);
  event.subject.fx = transform.invertX(mx);
  event.subject.fy = transform.invertY(my);
  
  emit('node-drag-end', event.subject);
}

function handleClick(event: any) {
  const [mx, my] = d3.pointer(event);
  const x = transform.invertX(mx);
  const y = transform.invertY(my);

  if (props.isPlacingNode) {
    emit('background-click', { x, y });
    return;
  }

  // Check Nodes
  for (const node of props.data.nodes) {
    if (node.x === undefined || node.y === undefined) continue;
    const dist = Math.hypot(x - node.x, y - node.y);
    if (dist < 20) {
      emit('node-click', node);
      return;
    }
  }

  // Check Links (Simple distance to line segment)
  let closestLink = null;
  let minLinkDist = 10;

  for (const link of props.data.links) {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    if (source.x === undefined || target.x === undefined || source.y === undefined || target.y === undefined) continue;
    
    // Approximate hit test: distance to midpoint
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    // If curved, adjust midpoint
    let cx = midX, cy = midY;
    if (link.curvature) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        cx = midX - dy * link.curvature;
        cy = midY + dx * link.curvature;
    }
    
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < minLinkDist) {
      minLinkDist = dist;
      closestLink = link;
    }
  }

  if (closestLink) {
    emit('link-click', closestLink);
    return;
  }

  emit('background-click', { x, y });
}

function handleMouseMove(event: any) {
  if (props.isPlacingNode) return;

  const [mx, my] = d3.pointer(event);
  const x = transform.invertX(mx);
  const y = transform.invertY(my);
  
  // Check Node Hover
  let hovering = false;
  for (const node of props.data.nodes) {
    if (node.x === undefined || node.y === undefined) continue;
    const dist = Math.hypot(x - node.x, y - node.y);
    if (dist < 20) {
      hovering = true;
      break;
    }
  }
  
  // Check Control Point Hover
  if (!hovering && props.selectedLink) {
    const link = props.selectedLink;
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    if (source.x !== undefined && target.x !== undefined && source.y !== undefined && target.y !== undefined) {
       let cx, cy;
       if (link.curvature) {
         const dx = target.x - source.x;
         const dy = target.y - source.y;
         cx = (source.x + target.x) / 2 - dy * link.curvature;
         cy = (source.y + target.y) / 2 + dx * link.curvature;
       } else {
         cx = (source.x + target.x) / 2;
         cy = (source.y + target.y) / 2;
       }
       if (Math.hypot(x - cx, y - cy) < 10) {
         hovering = true;
       }
    }
  }

  if (canvasRef.value) {
    canvasRef.value.style.cursor = hovering ? 'pointer' : 'default';
  }
}

// Watchers
watch(() => props.data, () => {
  if (simulation) simulation.stop();
  calculateNodeRadii(); // Recalculate radii when data changes
  initGraph();
}, { deep: true });

watch(() => props.config, () => {
  if (simulation) {
    // Recalculate radii if size-related config changed
    calculateNodeRadii();
    
    simulation.force('charge', d3.forceManyBody().strength(props.config.forceStrength || -2));
    simulation.force('link', d3.forceLink<GraphNode, GraphLink>(props.data.links).id(d => d.id));
    simulation.force('center', d3.forceCenter(width / 2, height / 2).strength(props.config.centerForce || 1));
    simulation.force('collide', d3.forceCollide<GraphNode>()
      .radius(node => {
        const nodeRadius = getNodeRadius(node);
        const multiplier = props.config.collideRadius ? props.config.collideRadius / 40 : 1;
        return nodeRadius * 2 * multiplier;
      })
      .strength(props.config.collideStrength || 0.1));
    
    if (props.config.physicsEnabled) {
      // Enable physics: unfix all nodes and restart simulation
      props.data.nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      simulation.alpha(1).restart();
    } else {
      // Disable physics: fix all nodes in current position and stop simulation
      props.data.nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          node.fx = node.x;
          node.fy = node.y;
        }
      });
      simulation.stop();
    }
    requestAnimationFrame(render);
  }
}, { deep: true });

onMounted(() => {
  initGraph();
  window.addEventListener('resize', initGraph);
});

onUnmounted(() => {
  window.removeEventListener('resize', initGraph);
  if (simulation) simulation.stop();
});

// Expose render for parent to call if needed
defineExpose({ render });
</script>

<style scoped>
.graph-canvas {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
