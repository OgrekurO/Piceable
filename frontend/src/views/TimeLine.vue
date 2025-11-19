<template>
  <div class="museum-container">
    <header class="museum-header">
      <h1 class="glitch-text" data-text="INDUSTRIAL REVOLUTION">INDUSTRIAL REVOLUTION</h1>
      <p class="subtitle">MUSEUM ARCHIVES // TIMELINE DATA</p>
      
      <!-- 数据源切换模拟 -->
      <div class="controls">
        <button @click="loadData('json')" :class="{ active: currentSource === 'json' }">SRC: JSON</button>
        <button @click="loadData('csv')" :class="{ active: currentSource === 'csv' }">SRC: CSV</button>
      </div>
    </header>

    <div class="timeline-wrapper">
      <!-- 中心管道线 -->
      <div class="central-pipe"></div>

      <div 
        v-for="(item, index) in timelineData" 
        :key="index"
        class="timeline-item"
        :class="[index % 2 === 0 ? 'left' : 'right', { 'visible': item.visible }]"
        ref="itemRefs"
      >
        <!-- 连接臂 -->
        <div class="mechanical-arm"></div>
        
        <!-- 节点（类似压力表或螺丝） -->
        <div class="node-point">
          <div class="node-inner"></div>
        </div>

        <!-- 内容卡片 -->
        <div class="content-card">
          <div class="card-screws">
            <span>+</span><span>+</span><span>+</span><span>+</span>
          </div>
          <div class="year-badge">{{ item.year }}</div>
          <h3 class="title">{{ item.title }}</h3>
          <div class="blueprint-line"></div>
          <p class="description">{{ item.description }}</p>
          <div class="card-footer">ID: {{ generateId(index) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue';

// 定义时间线项目类型
interface TimelineItem {
  year: string;
  title: string;
  description: string;
  visible: boolean;
}

// --- 模拟数据 ---
const jsonData: TimelineItem[] = [
  { year: "1769", title: "瓦特蒸汽机", description: "詹姆斯·瓦特改良了蒸汽机，大大提高了热效率，标志着工业革命的开始。", visible: false },
  { year: "1801", title: "雅卡尔提花机", description: "约瑟夫·玛丽·雅卡尔发明了使用穿孔卡片控制花样的织布机，是计算机编程的雏形。", visible: false },
  { year: "1825", title: "史蒂芬森号", description: "世界上第一条公共铁路建成，乔治·史蒂芬森的'机车一号'牵引着列车运行。", visible: false },
  { year: "1885", title: "奔驰一号", description: "卡尔·本茨制造出世界上第一辆以汽油为动力的三轮汽车。", visible: false },
  { year: "1913", title: "福特流水线", description: "亨利·福特引入移动装配线，将汽车生产时间从12小时缩短至90分钟。", visible: false }
];

const csvRawData = `year,title,description
1947,晶体管发明,贝尔实验室发明了晶体管，开启了电子时代的大门。
1969,阿帕网诞生,互联网的前身ARPANET建立，连接了四所大学的计算机。
1980,工业机器人,通用汽车广泛应用可编程的工业机器人，自动化生产进入新阶段。
2011,工业 4.0,德国汉诺威工业博览会首次提出工业4.0概念，强调互联与智能制造。`;

// --- 状态与逻辑 ---
const timelineData = ref<TimelineItem[]>([]);
const itemRefs = ref<HTMLElement[]>([]);
const currentSource = ref<string>('json');
let observer: IntersectionObserver | null = null;

// 生成伪随机ID
const generateId = (idx: number) => `HEX-${(1000 + idx).toString(16).toUpperCase()}`;

// CSV 解析器
const parseCSV = (csvText: string): Omit<TimelineItem, 'visible'>[] => {
  const lines = csvText.trim().split('\n');
  const firstLine = lines[0];
  if (!firstLine) {
    return [];
  }
  
  const headers = firstLine.split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj as Omit<TimelineItem, 'visible'>;
  });
};

// 加载数据
const loadData = (type: string) => {
  currentSource.value = type;
  // 重置数据以触发动画
  timelineData.value = []; 
  
  setTimeout(() => {
    if (type === 'json') {
      timelineData.value = jsonData.map(i => ({ ...i, visible: false }));
    } else {
      timelineData.value = parseCSV(csvRawData).map(i => ({ ...i, visible: false }));
    }
    
    // 等待 DOM 更新后重新绑定观察器
    nextTick(() => {
      setupIntersectionObserver();
    });
  }, 300);
};

// 滚动监听动画
const setupIntersectionObserver = () => {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 找到对应的数据项并标记为可见
        const index = itemRefs.value.indexOf(entry.target as HTMLElement);
        if (index !== -1 && timelineData.value[index]) {
          timelineData.value[index].visible = true;
        }
      }
    });
  }, { threshold: 0.2 }); // 元素出现 20% 时触发

  // 绑定 DOM 元素（注意：在 v-for 中 ref 会自动收集为数组，但需要确保 DOM 已渲染）
  const elements = document.querySelectorAll('.timeline-item');
  elements.forEach(el => observer!.observe(el));
};

onMounted(() => {
  loadData('json');
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
/* --- 字体与变量 --- */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Teko:wght@400;600&display=swap');

:root {
  --bg-color: #1a1a1a;
  --card-bg: #242424;
  --accent-orange: #ff9f1c;
  --accent-blue: #2ec4b6;
  --text-main: #e0e0e0;
  --pipe-color: #444;
  --border-color: #555;
}

.museum-container {
  background-color: #111;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px; /* 网格背景 */
  color: #eee;
  font-family: 'Share Tech Mono', monospace;
  min-height: 100vh;
  padding: 40px 20px;
  overflow-x: hidden;
  overflow-y: auto; /* 允许纵向滚动 */
}

/* --- 头部样式 --- */
.museum-header {
  text-align: center;
  margin-bottom: 80px;
  border-bottom: 2px solid #333;
  padding-bottom: 20px;
  position: relative;
}

.museum-header h1 {
  font-family: 'Teko', sans-serif;
  font-size: 4rem;
  margin: 0;
  letter-spacing: 5px;
  color: var(--text-main);
  text-transform: uppercase;
  text-shadow: 2px 2px 0px var(--accent-orange);
}

.subtitle {
  color: var(--accent-blue);
  letter-spacing: 2px;
  opacity: 0.8;
}

.controls button {
  background: transparent;
  border: 1px solid var(--accent-blue);
  color: var(--accent-blue);
  padding: 8px 20px;
  margin: 0 10px;
  font-family: 'Share Tech Mono', monospace;
  cursor: pointer;
  transition: 0.3s;
  text-transform: uppercase;
}

.controls button.active, .controls button:hover {
  background: var(--accent-blue);
  color: #000;
  box-shadow: 0 0 15px var(--accent-blue);
}

/* --- 时间轴容器 --- */
.timeline-wrapper {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 0;
}

/* 中央管道 */
.central-pipe {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 10px;
  background: repeating-linear-gradient(
    45deg,
    #333,
    #333 10px,
    #222 10px,
    #222 20px
  );
  border: 2px solid #555;
  transform: translateX(-50%);
  z-index: 1;
  box-shadow: inset 0 0 10px #000;
}

/* 时间轴单项 */
.timeline-item {
  position: relative;
  width: 50%;
  margin-bottom: 60px;
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 左右布局 */
.timeline-item.left {
  left: 0;
  padding-right: 60px;
  transform: translateX(-50px);
  text-align: right;
}

.timeline-item.right {
  left: 50%;
  padding-left: 60px;
  transform: translateX(50px);
}

/* 动画激活状态 */
.timeline-item.visible {
  opacity: 1;
  transform: translateX(0);
}

/* --- 机械臂连接部件 --- */
.mechanical-arm {
  position: absolute;
  top: 30px;
  height: 4px;
  background: #555;
  width: 60px;
  z-index: 2;
}

.timeline-item.left .mechanical-arm { right: 0; }
.timeline-item.right .mechanical-arm { left: 0; }

/* --- 中心节点 --- */
.node-point {
  position: absolute;
  top: 20px;
  width: 24px;
  height: 24px;
  background: #222;
  border: 2px solid var(--accent-orange);
  border-radius: 50%;
  z-index: 3;
  box-shadow: 0 0 10px var(--accent-orange);
}

.timeline-item.left .node-point { right: -12px; }
.timeline-item.right .node-point { left: -12px; }

.node-inner {
  width: 10px;
  height: 10px;
  background: var(--accent-orange);
  border-radius: 50%;
  margin: 6px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* --- 内容卡片 (蓝图/金属板风格) --- */
.content-card {
  background: rgba(40, 40, 40, 0.9);
  border: 1px solid #444;
  padding: 20px;
  position: relative;
  box-shadow: 10px 10px 0px rgba(0,0,0,0.5);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: transform 0.3s;
}

.content-card:hover {
  transform: scale(1.02);
  border-color: var(--accent-orange);
}

/* 装饰用的螺丝 */
.card-screws span {
  position: absolute;
  color: #555;
  font-size: 12px;
}
.card-screws span:nth-child(1) { top: 5px; left: 5px; }
.card-screws span:nth-child(2) { top: 5px; right: 5px; }
.card-screws span:nth-child(3) { bottom: 5px; left: 5px; }
.card-screws span:nth-child(4) { bottom: 5px; right: 5px; }

.year-badge {
  display: inline-block;
  background: var(--accent-orange);
  color: #000;
  font-weight: bold;
  padding: 2px 10px;
  font-size: 1.2rem;
  margin-bottom: 10px;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
}

.title {
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
  font-family: 'Teko', sans-serif;
  letter-spacing: 1px;
}

.blueprint-line {
  height: 1px;
  background: repeating-linear-gradient(90deg, var(--accent-blue), var(--accent-blue) 5px, transparent 5px, transparent 10px);
  margin: 10px 0;
  opacity: 0.5;
}

.description {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #bbb;
}

.card-footer {
  margin-top: 15px;
  font-size: 0.7rem;
  color: #666;
  border-top: 1px solid #333;
  padding-top: 5px;
  text-align: left;
}

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .central-pipe {
    left: 20px;
  }
  
  .timeline-item {
    width: 100%;
    padding-left: 60px;
    padding-right: 0;
  }
  
  .timeline-item.left, .timeline-item.right {
    left: 0;
    text-align: left;
    transform: translateY(20px);
    opacity: 0;
  }
  
  .timeline-item.visible {
    transform: translateY(0);
  }
  
  .timeline-item.left .mechanical-arm,
  .timeline-item.right .mechanical-arm {
    left: 20px;
    width: 40px;
  }
  
  .timeline-item.left .node-point,
  .timeline-item.right .node-point {
    left: 8px;
    right: auto;
  }

  .museum-header h1 {
    font-size: 2.5rem;
  }
}
</style>