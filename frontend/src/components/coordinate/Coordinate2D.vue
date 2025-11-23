<template>
  <div class="coordinate-2d">
    <!-- Y轴面板（固定宽度） -->
    <div class="y-axis-panel" ref="yAxisRef" :key="`${config.xAxis}-${config.yAxis}-${config.zAxis}-${config.planeMode}`">
      <div class="y-axis-content" :style="{ height: totalHeight + 'px', transform: `translateY(${-scrollTop}px)` }">
        <div v-for="(label, i) in layout.yDomain" :key="`${i}-${label}`" class="y-label" :style="{ top: (i * layout.rowHeight) + 70 + 'px' }">
          {{ label }}
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- X轴头部（固定） -->
      <div class="x-axis-header" :key="`x-axis-${config.xAxis}-${config.yAxis}-${config.zAxis}-${config.planeMode}`">
        <div class="x-axis-labels" :style="{ transform: layout.type === 'timeline' ? 'none' : `translateX(${transform.x}px) scaleX(${transform.k})` }">
          <!-- 时间线标签 -->
          <div v-if="layout.type === 'timeline'" class="labels-container timeline" key="timeline-container">
            <div 
              v-for="(tick, i) in currentTicks" 
              :key="`tick-${i}-${tick.getTime()}`" 
              class="x-label"
              :style="{ left: getXPosition(i) + 'px' }"
            >
              {{ formatXLabel(tick) }}
            </div>
          </div>
          <!-- 矩阵标签 -->
          <div v-else class="labels-container matrix" key="matrix-container">
            <div 
              v-for="(label, i) in layout.xDomain" 
              :key="`x-${i}-${label}`" 
              class="x-label"
              :style="{ left: getXPosition(i) + 'px' }"
            >
              {{ formatXLabel(label) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 画布（可滚动） -->
      <div class="canvas-wrapper" ref="wrapperRef" @scroll="onScroll">
        <div class="canvas-content" :style="{ height: (totalHeight - 40) + 'px', width: '100%' }">
          <canvas ref="canvasRef"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import * as d3 from 'd3';

// 数据点类型定义
interface DataPoint {
  [key: string]: any;
}

// 渲染节点接口，扩展数据点
interface RenderNode extends DataPoint {
  _x?: number;
  _y?: number;
  _xIndex?: number;
  _yIndex?: number;
  _start?: Date | null;
  _end?: Date | null;
  _renderX1?: number;
  _renderX2?: number;
  _renderY?: number;
}

// 配置类型定义
interface Config {
  xAxis: string;
  yAxis: string;
  zAxis: string;
  colorBy: string;
  shapeBy: string;
  planeMode: 'XY' | 'XZ' | 'YZ';
}

// 定义组件属性
const props = defineProps<{
  data: DataPoint[]; // 数据点数组
  config: Config;    // 配置对象
}>();

// 定义组件事件
const emit = defineEmits(['node-hover']); // 节点悬停事件

// 元素引用
const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const yAxisRef = ref<HTMLElement | null>(null);

// 状态管理
let ctx: CanvasRenderingContext2D | null = null; // Canvas 2D 上下文
let width = 0; // 画布宽度
const transform = ref(d3.zoomIdentity); // 缩放变换
const scrollTop = ref(0); // 滚动位置
const currentTicks = ref<Date[]>([]); // 动态时间刻度
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let animationId: number; // 动画ID

/**
 * 更新刻度函数
 * 根据当前变换更新X轴刻度
 */
const updateTicks = () => {
  try {
    const { type, timeDomain } = layout.value;
    if (type !== 'timeline' || !timeDomain || !wrapperRef.value) {
      currentTicks.value = [];
      return;
    }

    const width = wrapperRef.value.clientWidth;
    if (!width || width <= 0) {
      currentTicks.value = [];
      return;
    }

    const timeScale = d3.scaleTime()
      .domain(timeDomain as Date[])
      .range([20, width - 20]);

    // 根据当前变换重新缩放
    const rescaledScale = transform.value.rescaleX(timeScale);
    currentTicks.value = rescaledScale.ticks(10);
  } catch (error) {
    console.warn('Error updating ticks:', error);
    currentTicks.value = [];
  }
};

// 颜色比例尺
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// 图片缓存
const imageCache = new Map<string, HTMLImageElement>();

/**
 * 加载图片函数
 * @param url - 图片URL
 * @returns HTMLImageElement对象或null
 */
const loadImage = (url: string): HTMLImageElement | null => {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url)!;
  
  const img = new Image();
  img.src = url;
  img.onload = () => {
    requestAnimationFrame(render);
  };
  imageCache.set(url, img);
  return img;
};

/**
 * 解析日期函数
 * @param dateStr - 日期字符串
 * @returns Date对象或null
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  if (/^\d{4}$/.test(dateStr)) return new Date(parseInt(dateStr), 0, 1);
  return null;
};

/**
 * 获取X位置函数
 * @param index - 索引
 * @returns X坐标位置
 */
const getXPosition = (index: number) => {
  if (!wrapperRef.value) return 0;
  const width = wrapperRef.value.clientWidth;
  const { xDomain, type, timeDomain } = layout.value;
  
  if (type === 'timeline') {
    // 时间线模式使用当前刻度
    const tick = currentTicks.value[index];
    if (!tick || !timeDomain) return 0;
    
    const timeScale = d3.scaleTime()
      .domain(timeDomain as Date[])
      .range([20, width - 20]);
      
    // 应用当前变换到比例尺
    const rescaledScale = transform.value.rescaleX(timeScale);
    return rescaledScale(tick);
  } else {
    // 矩阵模式使用分类分布
    const step = width / xDomain.length;
    return index * step + step / 2;
  }
};

/**
 * 格式化X轴标签函数
 * @param label - 标签值
 * @returns 格式化后的标签文本
 */
const formatXLabel = (label: any) => {
  if (label instanceof Date) {
    // 格式化日期
    return d3.timeFormat('%Y-%m')(label);
  }
  // 返回分类数据的字符串表示
  return String(label);
};

// 布局计算
const layout = computed(() => {
  if (props.data.length === 0) return { nodes: [] as RenderNode[], xDomain: [] as any[], yDomain: [] as any[], type: 'empty', rowHeight: 40 };

  // Determine Axes based on Plane Mode
  let xField = props.config.xAxis;
  let yField = props.config.yAxis;

  if (props.config.planeMode === 'XZ') {
      xField = props.config.xAxis;
      yField = props.config.zAxis;
  } else if (props.config.planeMode === 'YZ') {
      xField = props.config.yAxis;
      yField = props.config.zAxis;
  }

  // 检查时间轴数据（仅在X轴为时间类型或明确要求时检查，但目前保留自动检测逻辑）
  // 我们将沿用之前的逻辑：如果数据包含出生日期/开始日期，则将X轴视为时间轴。
  // 但需要尊重平面模式。如果用户选择XZ平面且X轴为时间轴，则将其视为时间轴图表。
  
  // 获取数据的第一行用于检测字段类型，如果数据为空则使用空对象
  const firstRow = props.data[0] || {};
  
  // 定义时间字段列表：只有当选定的 X 轴字段在此列表中时，才将其视为时间轴
  const timeFields = ['Birthdate', 'Start', 'Date', 'Time', 'Year','Date of Death'];
  
  // 判断是否为时间数据：
  // 1. xField（选定的X轴字段）必须在 timeFields 列表中
  // 2. 第一行数据中必须存在该字段的值
  const isTimeData = timeFields.includes(xField) && (firstRow[xField]);
  
  // 如果确定为时间数据，进入时间轴模式处理
  if (isTimeData) {
    // 将选定的 X 轴字段作为起始时间字段
    const startField = xField;
    
    // 尝试找到对应的结束时间字段（例如：Start -> End, Birthdate -> Date of Death）
    let endField = null;
    if (startField === 'Birthdate') endField = 'Date of Death';  // 出生日期 -> 死亡日期
    else if (startField === 'Start') endField = 'End';            // 开始 -> 结束
    else if (startField === 'Date') endField = null;              // 单一时间点，无结束时间
    
    // 备用方案：如果上面没有匹配到结束字段，检查数据中是否存在通用的结束字段
    if (!endField && firstRow['End']) endField = 'End';
    if (!endField && firstRow['Date of Death']) endField = 'Date of Death';

    // 处理所有数据节点，解析时间字段
    const timeNodes: RenderNode[] = props.data.map(d => {
      const start = parseDate(d[startField]);  // 解析起始时间
      const end = endField ? parseDate(d[endField]) : new Date();  // 解析结束时间，如果没有则使用当前时间
      return { ...d, _start: start, _end: end };  // 返回包含解析后时间的节点
    }).filter(d => d._start);  // 过滤掉起始时间解析失败的节点

    // 只有当存在有效的时间节点时才继续处理
    if (timeNodes.length > 0) {
      // 计算所有节点中最早的起始时间
      const minDate = d3.min(timeNodes, d => d._start!) || new Date();
      // 计算所有节点中最晚的结束时间（如果没有结束时间则使用起始时间）
      const maxDate = d3.max(timeNodes, d => d._end || d._start!) || new Date();
      
      // 定义时间轴的显示范围：在最小和最大时间的基础上各扩展一年
      // 31536000000 毫秒 = 365 天
      const timeDomain = [
        new Date(minDate.getTime() - 31536000000),  // 最小时间前推一年
        new Date(maxDate.getTime() + 31536000000)   // 最大时间后推一年
      ];

      // 生成 X 轴的时间刻度标签
      const timeScale = d3.scaleTime().domain(timeDomain).range([0, 1]);
      const ticks = timeScale.ticks(10); // 自动生成约 10 个刻度（年、月等，D3 会自动选择合适的粒度）

      // 按 Y 轴字段对数据进行分组
      // 提取所有唯一的 Y 值并排序，用于确定每个节点在 Y 轴上的位置
      const yDomain = Array.from(new Set(timeNodes.map(d => d[yField] || 'Unknown'))).sort();
      const rowHeight = 40;  // 每行的高度（像素）
      
      // 为每个节点计算其在画布上的 Y 坐标
      const nodes: RenderNode[] = timeNodes.map(d => {
        const groupVal = d[yField] || 'Unknown';  // 获取该节点的 Y 轴分类值
        const yIndex = yDomain.indexOf(groupVal);  // 找到该值在 yDomain 中的索引
        return {
          ...d,
          _yIndex: yIndex,                    // 保存 Y 轴索引
          _y: yIndex * rowHeight + 35        // 计算 Y 坐标：索引 * 行高 + 40px（头部偏移）
        };
      });

      // Use ticks as xDomain for rendering labels
      return { nodes, xDomain: ticks, yDomain, type: 'timeline', rowHeight, timeDomain }; // Add timeDomain to layout
    }
  }

  // Matrix / Scatter View
  const xDomain = Array.from(new Set(props.data.map(d => d[xField] || 'Unknown'))).sort();
  const yDomain = Array.from(new Set(props.data.map(d => d[yField] || 'Unknown'))).sort();
  
  const rowHeight = 60; // Fixed height for matrix rows
  
  const nodes: RenderNode[] = props.data.map(d => {
      const xVal = d[xField] || 'Unknown';
      const yVal = d[yField] || 'Unknown';
      const xIndex = xDomain.indexOf(xVal);
      const yIndex = yDomain.indexOf(yVal);
      
      return {
          ...d,
          _xIndex: xIndex,
          _yIndex: yIndex,
          _y: yIndex * rowHeight
      };
  });

  // 调整X位置（将在渲染时基于缩放完成）
  return { nodes, xDomain, yDomain, type: 'matrix', rowHeight };
});

// 总高度计算
const totalHeight = computed(() => {
    return layout.value.yDomain.length * layout.value.rowHeight + 20;
});

// 监听变换更新刻度
watch(() => transform.value, () => {
  if (layout.value.type === 'timeline') {
    nextTick(() => {
      updateTicks();
    });
  }
}, { flush: 'post' });

// 监听布局初始化刻度
watch(() => layout.value, () => {
  if (layout.value.type === 'timeline') {
    nextTick(() => {
      updateTicks();
    });
  }
}, { flush: 'post' });

/**
 * 初始化Canvas
 */
const initCanvas = () => {
  if (!wrapperRef.value || !canvasRef.value) return;
  
  width = wrapperRef.value.clientWidth;
  const height = totalHeight.value;
  
  const canvas = canvasRef.value;
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d');

  // 重置变换
  transform.value = d3.zoomIdentity;

  // 移除旧事件监听器
  d3.select(canvas).on('.zoom', null);
  canvas.removeEventListener('mousemove', handleMouseMove);

  // 缩放行为（仅X轴）
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.1, 10])
    .filter((event) => {
      // 允许滚轮事件进行缩放，但阻止默认滚动行为
      // 允许拖拽事件进行平移
      return !event.ctrlKey && !event.button;
    })
    .on('zoom', (event) => {
      // 仅对X应用缩放，Y保持为0
      const newTransform = event.transform;
      transform.value = d3.zoomIdentity
        .translate(newTransform.x, 0)
        .scale(newTransform.k);
      requestAnimationFrame(render);
    });

  d3.select(canvas).call(zoom);
  
  // 添加鼠标移动监听器
  canvas.addEventListener('mousemove', handleMouseMove);
  
  render();
};

/**
 * 滚动事件处理函数
 */
const onScroll = () => {
    if (wrapperRef.value) {
        scrollTop.value = wrapperRef.value.scrollTop;
    }
};

/**
 * 渲染循环函数
 */
const render = () => {
  if (!ctx || !width) return;
  
  const height = totalHeight.value;
  if (canvasRef.value) {
      if (canvasRef.value.height !== height) canvasRef.value.height = height;
      if (canvasRef.value.width !== width) canvasRef.value.width = width;
  }

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  
  const { nodes, xDomain, yDomain, type, rowHeight, timeDomain } = layout.value;

  if (type === 'timeline') {
    // 使用 timeDomain（实际时间范围）而不是 xDomain（刻度）
    const timeScale = d3.scaleTime()
      .domain(timeDomain as Date[])
      .range([20, width - 20]);

    // 应用缩放变换到比例尺
    const rescaledX = transform.value.rescaleX(timeScale);

    // 绘制垂直网格线
    const ticks = rescaledX.ticks(10);
    ticks.forEach(t => {
      const x = rescaledX(t);
      ctx!.strokeStyle = '#eee';
      ctx!.beginPath();
      ctx!.moveTo(x, 0);
      ctx!.lineTo(x, height);
      ctx!.stroke();
    });

    // 绘制节点
    nodes.forEach(node => {
      if (!node._start || node._y === undefined) return;
      
      const x1 = rescaledX(node._start);
      const x2 = node._end ? rescaledX(node._end) : x1 + 5;
      const y = node._y;
      
      // 条形图
      const colorKey = props.config.colorBy ? node[props.config.colorBy] : 'default';
      ctx!.fillStyle = props.config.colorBy ? colorScale(colorKey) : '#42b883';
      ctx!.globalAlpha = 0.7;
      
      const barHeight = 20;
      ctx!.fillRect(x1, y - barHeight/2, Math.max(x2 - x1, 2), barHeight);
      ctx!.globalAlpha = 1.0;

      // 标签
      ctx!.fillStyle = '#000';
      ctx!.font = '10px sans-serif';
      ctx!.textAlign = 'left';
      const label = node['Name'] || node['name'] || 'Node';
      ctx!.fillText(label, x1 + 5, y + 4);

      // 存储用于交互
      node._renderX1 = x1;
      node._renderX2 = Math.max(x2, x1 + 2);
      node._renderY = y;
    });

  } else if (type === 'matrix') {
     // Matrix View
     // X Axis is categorical. We distribute them evenly.
     const xScale = d3.scalePoint()
        .domain(xDomain as string[])
        .range([20, width - 20])
        .padding(0.5);
     
     // Apply Zoom? scalePoint doesn't support rescaleX directly in same way for continuous zoom
     // We can simulate by modifying range
     const step = (width / xDomain.length) * transform.value.k;
     
     // 绘制网格
     ctx.strokeStyle = '#eee';
     ctx.lineWidth = 1;

     // 水平线
     yDomain.forEach((_, i) => {
         const y = i * rowHeight;
         ctx!.beginPath();
         ctx!.moveTo(0, y);
         ctx!.lineTo(width, y);
         ctx!.stroke();
     });

     // 垂直线
     xDomain.forEach((label, i) => {
         const x = transform.value.applyX(i * step + step/2 + 20);
         ctx!.strokeStyle = '#eee';
         ctx!.beginPath();
         ctx!.moveTo(x, 0);
         ctx!.lineTo(x, height);
         ctx!.stroke();
     });

     // 节点
     const cellCounts: Record<string, number> = {};
     
     nodes.forEach(node => {
        if (node._xIndex === undefined || node._y === undefined) return;
        
        const key = `${node._xIndex}-${node._yIndex}`;
        const count = cellCounts[key] || 0;
        cellCounts[key] = count + 1;
        
        // 计算X基于缩放
        // 列的基准X
        const colX = transform.value.applyX(node._xIndex * step + step/2 + 20);
        
        // 单元格内偏移
        const offset = (count % 5) * 15 - 30; // 简单抖动
        const x = colX + offset;
        const y = node._y;

        // 绘制
        const imageUrl = node['Pic'] || node['image'] || node['img'];
        if (imageUrl) {
            const img = loadImage(imageUrl);
            if (img && img.complete) {
                ctx!.save();
                ctx!.beginPath();
                ctx!.arc(x, y, 15, 0, Math.PI * 2);
                ctx!.clip();
                ctx!.drawImage(img, x - 15, y - 15, 30, 30);
                ctx!.restore();
            } else {
                ctx!.beginPath();
                ctx!.arc(x, y, 15, 0, Math.PI * 2);
                ctx!.fillStyle = '#ccc';
                ctx!.fill();
            }
        } else {
            ctx!.beginPath();
            ctx!.arc(x, y, 10, 0, Math.PI * 2);
            const colorKey = props.config.colorBy ? node[props.config.colorBy] : 'default';
            ctx!.fillStyle = props.config.colorBy ? colorScale(colorKey) : '#42b883';
            ctx!.fill();
        }

        ctx!.fillStyle = '#333';
        ctx!.font = '10px sans-serif';
        ctx!.textAlign = 'center';
        const label = node['Name'] || node['name'] || 'Node';
        ctx!.fillText(label, x, y + 25);
        
        node._renderX1 = x - 15;
        node._renderX2 = x + 15;
        node._renderY = y;
     });
  }

  ctx.restore();
};

/**
 * 鼠标移动处理函数（交互）
 * @param event - 鼠标事件
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  let hovered = null;
  const { nodes } = layout.value;
  
  // 反向迭代处理z顺序
  for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node && node._renderX1 !== undefined && node._renderX2 !== undefined && node._renderY !== undefined) {
          if (x >= node._renderX1 && x <= node._renderX2 && Math.abs(y - node._renderY) < 15) {
              hovered = node;
              break;
          }
      }
  }
  
  if (hovered) {
    emit('node-hover', hovered);
    document.body.style.cursor = 'pointer';
  } else {
    emit('node-hover', null);
    document.body.style.cursor = 'default';
  }
};

// 生命周期钩子
onMounted(() => {
  initCanvas();
  updateTicks();
  window.addEventListener('resize', () => {
      if (wrapperRef.value) width = wrapperRef.value.clientWidth;
      updateTicks();
      render();
  });
});

onUnmounted(() => {
  // 清理工作
});

// 监听数据和配置变化
watch(() => [props.data, props.config], () => {
  nextTick(() => {
    initCanvas();
    updateTicks();
  });
}, { deep: true });

</script>

<style scoped>
/* 2D坐标系容器样式 */
.coordinate-2d {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  background: #fff;
}

/* Y轴面板样式 */
.y-axis-panel {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid #eee;
  background: #f9f9f9;
  overflow: hidden; /* 隐藏滚动，通过变换同步 */
  position: relative;
}

.y-axis-content {
    position: relative;
    width: 100%;
}

.y-label {
    position: absolute;
    right: 10px;
    transform: translateY(-50%);
    font-size: 12px;
    font-weight: bold;
    color: #333;
    text-align: right;
    width: 100%;
    padding-right: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 主内容区域样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* X轴头部样式 */
.x-axis-header {
  height: 40px;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
  position: relative;
  overflow: hidden;
}

.x-axis-labels {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: left center;
}

.labels-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.x-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #333;
  text-align: center;
  white-space: nowrap;
  top: 50%;
  margin-top: -6px;
  pointer-events: none;
}

/* 画布包装器样式 */
.canvas-wrapper {
  flex: 1;
  overflow: auto; /* 启用滚动 */
  position: relative;
}

.canvas-content {
    position: relative;
}

canvas {
    display: block;
}
</style>