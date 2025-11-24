/*
  GraphCanvas.vue - 图谱画布组件

  功能：
  1. 基于D3.js和Canvas的图谱可视化渲染
  2. 节点和关系的交互处理
  3. 物理引擎模拟（力导向图）
  4. 图谱操作（缩放、拖拽、点击等）

  主要特性：
  - Canvas渲染，高性能支持大量节点
  - 力导向图算法实现节点自动布局
  - 支持节点图片、标签显示
  - 支持交互操作（选择、拖拽、缩放）
  - 响应式配置更新
*/
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

// 组件属性定义
const props = defineProps<{
  // 图谱数据，包含节点和关系
  data: { nodes: GraphNode[], links: GraphLink[] },
  // 图谱配置参数
  config: any,
  // 当前选中的关系
  selectedLink?: GraphLink | null,
  // 是否处于放置节点状态
  isPlacingNode?: boolean
}>();

// 组件事件定义
const emit = defineEmits(['node-click', 'link-click', 'background-click', 'node-drag-end', 'link-change']);

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// 物理引擎模拟器实例
let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

// 存储D3处理后的links(source和target已转换为节点对象)
const processedLinks = ref<GraphLink[]>([]);

// 缩放变换状态
let transform = d3.zoomIdentity;

// 画布尺寸
let width = 0;
let height = 0;

// 图片缓存，提升渲染性能
const imageCache = new Map<string, HTMLImageElement>();

// 颜色比例尺，用于节点着色
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Load Image Helper
// 加载图片辅助函数，支持图片缓存
const loadImage = (url: string): HTMLImageElement | null => {
  if (!url) {
    console.warn('GraphCanvas: 尝试加载空URL图片');
    return null;
  }
  
  if (imageCache.has(url)) return imageCache.get(url)!;
  
  const img = new Image();
  img.src = url;
  img.onload = () => {
    console.log('GraphCanvas: 图片加载成功', url);
    // Re-render when image loads
    requestAnimationFrame(render);
  };
  img.onerror = () => {
    console.error('GraphCanvas: 图片加载失败', url);
  };
  imageCache.set(url, img);
  return img;
};

// Initialize Graph
// 初始化图谱，设置画布、交互和物理引擎
const initGraph = () => {
  if (!containerRef.value || !canvasRef.value) return;
  
  // Reset dimensions
  width = containerRef.value.clientWidth;
  height = containerRef.value.clientHeight;

  const canvas = canvasRef.value;
  canvas.width = width;
  canvas.height = height;

  // Zoom Behavior
  // 设置缩放行为
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.1, 8])
    .on('zoom', (event) => {
      transform = event.transform;
      requestAnimationFrame(render);
    });

  // Drag Behavior
  // 设置拖拽行为
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
  // 点击事件处理
  d3.select(canvas).on('click', handleClick);
  
  // Hover Handling
  // 悬停事件处理
  d3.select(canvas).on('mousemove', handleMouseMove);

  // Custom boundary force to keep nodes within a circular boundary
  // 自定义边界力，将节点限制在圆形边界内
  const boundaryForce = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height)*1.5 - 50; // Leave 50px margin
    
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
  // 预计算节点半径以提升性能
  calculateNodeRadii();

  // 处理链接数据，确保source和target是节点对象而不是字符串
  const resolvedLinks = props.data.links.map(link => {
    // 如果source和target已经是节点对象，则直接返回
    if (typeof link.source !== 'string' && typeof link.target !== 'string') {
      return link;
    }
    
    // 否则根据ID查找对应的节点对象
    const sourceNode = props.data.nodes.find(n => n.id === link.source);
    const targetNode = props.data.nodes.find(n => n.id === link.target);
    
    if (sourceNode && targetNode) {
      return {
        ...link,
        source: sourceNode,
        target: targetNode
      };
    }
    
    return link;
  });

  
  // 保存处理后的links供绘制使用
  processedLinks.value = resolvedLinks;

  // Simulation
  // 物理引擎模拟器设置
  simulation = d3.forceSimulation<GraphNode, GraphLink>(props.data.nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(resolvedLinks)
      .id(d => d.id)
      .distance(100)  // 设置链接距离
    )
    .force('charge', d3.forceManyBody().strength(props.config.forceStrength || -2))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(props.config.centerForce || 1))
    .force('collide', d3.forceCollide<GraphNode>()
      .radius(node => {
        // Collision radius = node radius * 2 (diameter * 2)
        const nodeRadius = getNodeRadius(node);
        const multiplier = props.config.collideRadius ? props.config.collideRadius / 40 : 1;
        return nodeRadius * 14 * multiplier;
      })
      .strength(props.config.collideStrength || 0.1))
    .force('boundary', boundaryForce); // Add boundary force

  simulation.on('tick', () => {
    // Only render if physics is enabled
    // 仅在物理引擎启用时渲染
    if (props.config.physicsEnabled) {
      requestAnimationFrame(render);
    }
  });
  
  // If physics is disabled initially, stop the simulation
  // 如果初始时物理引擎被禁用，则停止模拟并固定节点位置
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
// 渲染循环，负责图谱的绘制
const render = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  // Draw Links
  // 绘制关系连线 - 使用D3处理后的links
  processedLinks.value.forEach(link => drawLink(ctx, link));

  // Draw Nodes
  // 绘制节点
  props.data.nodes.forEach(node => drawNode(ctx, node));

  ctx.restore();
};

// Pre-calculate and cache node radii for performance
// 预计算并缓存节点半径以提升性能
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
// 获取节点半径（从缓存中）
const getNodeRadius = (node: GraphNode): number => {
  return (node as any)._radius || 20;
};

// Draw Node
// 绘制节点
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

  // Draw Image 渲染图片
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

  // Draw Label 标签标签
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';

  // 根据配置选择显示的字段，默认显示label
  const labelField = props.config.nodeLabelField || 'label';
  let label = node.label || node.id || 'Unknown'; // 默认使用label字段，如果没有则使用id，再没有则显示Unknown

  // 如果配置了其他字段且该字段存在且不为空，则使用配置的字段
  if (labelField !== 'label' && 
      node[labelField] !== undefined && 
      node[labelField] !== null && 
      String(node[labelField]).trim() !== '') {
    label = String(node[labelField]);
  }

  ctx.fillText(label, node.x + r + 4, node.y + 4);
};

// Draw Link
// 绘制关系连线
const drawLink = (ctx: CanvasRenderingContext2D, link: GraphLink) => {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;
  
  // 添加调试:检查第一个link
  if (link === props.data.links[0]) {
    console.log('[drawLink] 第一个link:', link);
    console.log('[drawLink] source:', source, 'type:', typeof source);
    console.log('[drawLink] target:', target, 'type:', typeof target);
    console.log('[drawLink] source.x:', source?.x, 'source.y:', source?.y);
    console.log('[drawLink] target.x:', target?.x, 'target.y:', target?.y);
  }
  
  if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) {
    if (link === props.data.links[0]) {
      console.log('[drawLink] 跳过绘制:节点位置未定义');
    }
    return;
  }

  ctx.beginPath();
  
  // Draw straight or curved line based on curvature
  if (link.curvature) {
    // Curved link
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const cx = (source.x + target.x) / 2 - dy * link.curvature;
    const cy = (source.y + target.y) / 2 + dx * link.curvature;
    
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(cx, cy, target.x, target.y);
  } else {
    // Straight link
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
  }
  
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw arrowhead if directed
  if (link.Direction === 'directed') {
    drawArrowhead(ctx, source, target, link.curvature);
  }
  
  // Draw link label
  if (link.type) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(link.type, midX, midY - 5);
    ctx.textAlign = 'start'; // Reset to default
  }
};

// Draw Arrowhead
// 绘制箭头
const drawArrowhead = (ctx: CanvasRenderingContext2D, source: GraphNode, target: GraphNode, curvature?: number) => {
  const arrowSize = 8;
  const arrowAngle = Math.PI / 6; // 30 degrees
  
  let angle;
  let arrowX, arrowY;
  
  if (curvature) {
    // For curved links, calculate tangent at end point
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const cx = (source.x + target.x) / 2 - dy * curvature;
    const cy = (source.y + target.y) / 2 + dx * curvature;
    
    // Calculate tangent at t=0.95
    const t = 0.95;
    const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * cx + t * t * target.x;
    const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * cy + t * t * target.y;
    
    angle = Math.atan2(target.y - py, target.x - px);
    
    // Arrow position at node edge
    arrowX = target.x - Math.cos(angle) * getNodeRadius(target);
    arrowY = target.y - Math.sin(angle) * getNodeRadius(target);
  } else {
    // For straight links
    angle = Math.atan2(target.y - source.y, target.x - source.x);
    
    // Arrow position at node edge
    arrowX = target.x - Math.cos(angle) * getNodeRadius(target);
    arrowY = target.y - Math.sin(angle) * getNodeRadius(target);
  }
  
  // Draw arrowhead
  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize * Math.tan(arrowAngle / 2));
  ctx.lineTo(-arrowSize, arrowSize * Math.tan(arrowAngle / 2));
  ctx.closePath();
  ctx.fillStyle = '#999';
  ctx.fill();
  ctx.restore();
};

// Interaction Helpers 交互帮助函数
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

  // Find node 寻找节点
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

/**
 * 处理节点拖拽开始事件
 * @param event - D3.js拖拽事件对象，包含拖拽相关信息
 */
function dragStarted(event: any) {
  // 如果正在放置节点，则不处理拖拽开始事件
  if (props.isPlacingNode) return;
  
  // 如果拖拽的是控制点，则不处理
  if (event.subject.type === 'control-point') {
    return;
  }
  
  // 当物理引擎启用且事件未激活时，重启模拟并设置alphaTarget值
  if (!event.active && props.config.physicsEnabled) {
    simulation?.alphaTarget(0.3).restart();
  }
  
  // 使用d3.pointer获取准确坐标
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

  // Check Links - 改进的曲线点击检测
  let closestLink = null;
  let minLinkDist = 10; // 点击容差

  for (const link of props.data.links) {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    if (source.x === undefined || target.x === undefined || source.y === undefined || target.y === undefined) continue;
    
    let minDist = Infinity;
    
    if (link.curvature) {
      // 对于曲线，使用多点采样检测
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const cx = (source.x + target.x) / 2 - dy * link.curvature;
      const cy = (source.y + target.y) / 2 + dx * link.curvature;
      
      // 采样10个点检测距离
      for (let t = 0; t <= 1; t += 0.1) {
        // 二次贝塞尔曲线公式
        const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * cx + t * t * target.x;
        const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * cy + t * t * target.y;
        const dist = Math.hypot(x - px, y - py);
        minDist = Math.min(minDist, dist);
      }
    } else {
      // 对于直线，计算点到线段的距离
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const lenSq = dx * dx + dy * dy;
      
      if (lenSq === 0) {
        minDist = Math.hypot(x - source.x, y - source.y);
      } else {
        let t = ((x - source.x) * dx + (y - source.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = source.x + t * dx;
        const projY = source.y + t * dy;
        minDist = Math.hypot(x - projX, y - projY);
      }
    }
    
    if (minDist < minLinkDist) {
      minLinkDist = minDist;
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
  if (props.data.nodes.length === 0) {
    return;
  }
  
  if (simulation) simulation.stop();
  calculateNodeRadii(); // Recalculate radii when data changes
  initGraph();
}, { deep: true });

watch(() => props.config, () => {
  if (simulation) {
    // Update forces based on new config
    simulation
      .force('charge', d3.forceManyBody().strength(props.config.forceStrength || -2))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(props.config.centerForce || 1))
      .force('collide', d3.forceCollide<GraphNode>()
        .radius(node => {
          const nodeRadius = getNodeRadius(node);
          const multiplier = props.config.collideRadius ? props.config.collideRadius / 40 : 1;
          return nodeRadius * 14 * multiplier;
        })
        .strength(props.config.collideStrength || 0.1));
    
    // 如果物理引擎启用则重启模拟
    if (props.config.physicsEnabled) {
      simulation.alphaTarget(0.3).restart();
    } else {
      simulation.stop();
    }
    
    requestAnimationFrame(render);
  }
}, { deep: true });

onMounted(() => {
  try {
    initGraph();
    window.addEventListener('resize', initGraph);
  } catch (error) {
    console.error('GraphCanvas组件挂载失败:', error);
  }
});

onUnmounted(() => {
  console.log('GraphCanvas组件卸载');
  window.removeEventListener('resize', initGraph);
  if (simulation) {
    simulation.stop();
    simulation = null;
  }
  // Clear caches
  imageCache.clear();
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
