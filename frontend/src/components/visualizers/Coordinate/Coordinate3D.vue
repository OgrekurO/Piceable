<template>
  <div class="coordinate-3d" ref="containerRef">
    <!-- 视图立方体控件 -->
    <div class="view-cube">
      <div class="cube-face front" @click="setView('Front')">F</div>
      <div class="cube-face back" @click="setView('Back')">B</div>
      <div class="cube-face left" @click="setView('Left')">L</div>
      <div class="cube-face right" @click="setView('Right')">R</div>
      <div class="cube-face top" @click="setView('Top')">T</div>
      <div class="cube-face bottom" @click="setView('Bottom')">Btm</div>
      <div class="cube-corner" @click="setView('Iso')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';

// 数据点类型定义
interface DataPoint {
  [key: string]: any;
}

// 配置类型定义
interface Config {
  xAxis: string;
  yAxis: string;
  zAxis: string;
  colorBy: string;
  shapeBy: string;
}

// 定义组件属性
const props = defineProps<{
  data: DataPoint[]; // 数据点数组
  config: Config;    // 配置对象
}>();

// 定义组件事件
const emit = defineEmits(['node-hover']); // 节点悬停事件

// 容器引用
const containerRef = ref<HTMLElement | null>(null);

// Three.js 相关变量
let scene: THREE.Scene | null = null;           // 场景
let camera: THREE.OrthographicCamera | null = null; // 相机
let renderer: THREE.WebGLRenderer | null = null;   // 渲染器
let controls: OrbitControls | null = null;         // 控制器
let nodes: THREE.Mesh[] = [];                      // 节点数组
let raycaster: THREE.Raycaster;                    // 射线投射器（用于鼠标交互）
let mouse: THREE.Vector2;                          // 鼠标位置
let animationId: number;                           // 动画ID
let resizeObserver: ResizeObserver | null = null; // 尺寸观察器


// 颜色比例尺
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

/**
 * 字符串哈希函数
 * @param str - 输入字符串
 * @returns 哈希值
 */
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash;
};

/**
 * 生成形状纹理
 * @param shape - 形状类型
 * @param color - 颜色
 * @returns THREE.CanvasTexture纹理对象
 */
const getShapeTexture = (shape: string, color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = color;
  const cx = 32;
  const cy = 32;
  const r = 28;

  // 根据形状类型绘制不同图形
  if (shape === 'Circle') {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'Ring') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape === 'Square') {
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  } else if (shape === 'Triangle') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'Star') {
    // 绘制简单星星
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * r + cx,
                 -Math.sin((18 + i * 72) / 180 * Math.PI) * r + cy);
      ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * r * 0.5 + cx,
                 -Math.sin((54 + i * 72) / 180 * Math.PI) * r * 0.5 + cy);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // 默认圆形
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

/**
 * 更新相机视锥体参数
 * 根据容器尺寸计算并更新正交相机的视锥体
 */
const updateCameraFrustum = () => {
  if (!containerRef.value || !camera) return;
  
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  const aspect = width / height;
  const frustumSize = 2; // 视锥体大小，控制可见范围
  const CAMERA_SHIFT_Y = 0.2;

  
  // 计算视锥体参数
  camera.left = frustumSize * aspect / -2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2 + CAMERA_SHIFT_Y;
  camera.bottom = frustumSize / -2 + CAMERA_SHIFT_Y;
  
  // 更新投影矩阵
  camera.updateProjectionMatrix();
};

/**
 * 初始化Three.js环境
 */
const initThree = () => {
  if (!containerRef.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f2f5);

  // 创建相机（正交相机，实现平行投影）
  // 先用默认参数创建相机，之后通过 updateCameraFrustum 设置正确的视锥体
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.set(3, 3, 3); // 等距视角起始位置
  camera.lookAt(0.5, 0.5, 0.5); // 看向中心点
  
  // 根据容器尺寸更新相机视锥体
  updateCameraFrustum();

  // 创建渲染器
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  containerRef.value.appendChild(renderer.domElement);

  // 创建控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0.5, 0.5, 0.5); // 围绕中心点旋转

  // 添加坐标轴辅助器
  const axesHelper = new THREE.AxesHelper(1.2); // 略大于1

  const material = axesHelper.material;
  material.color.set("#555"); // 总是渲染在其他几何体之上


  scene.add(axesHelper);
  // 修改坐标轴颜色示例
  
  // 添加坐标轴标签
  addAxisLabel('X', 1.3, 0, 0, '#000');
  addAxisLabel('Y', 0, 1.3, 0, '#000');
  addAxisLabel('Z', 0, 0, 1.3, '#000');

  // 初始化射线投射器和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 添加事件监听器
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  // 添加 ResizeObserver 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    onWindowResize();
  });
  resizeObserver.observe(containerRef.value);

  // 启动动画循环
  animate();
};

/**
 * 添加坐标轴标签
 * @param text - 标签文本
 * @param x - X坐标
 * @param y - Y坐标
 * @param z - Z坐标
 * @param color - 颜色
 */
const addAxisLabel = (text: string, x: number, y: number, z: number, color: string) => {
    if (!scene) return;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.2, 0.2, 0.2);
    scene.add(sprite);
};

/**
 * 更新场景
 * 根据数据和配置更新3D场景中的节点
 */
const updateScene = () => {
  if (!scene || !props.data.length) return;

  // 清除旧节点
  nodes.forEach(node => {
    scene!.remove(node);
    if (node.geometry) node.geometry.dispose();
    if (node.material instanceof THREE.Material) node.material.dispose();
  });
  nodes = [];

  const { xAxis, yAxis, zAxis, colorBy, shapeBy } = props.config;

  // 创建比例尺（归一化到0-1）
  const getScale = (axis: string) => {
    if (!axis) return () => 0.5;
    const values = props.data.map(d => d[axis]);
    const isNumeric = values.every(v => !isNaN(parseFloat(v)));
    
    if (isNumeric) {
      const extent = d3.extent(values, d => parseFloat(d)) as [number, number];
      return d3.scaleLinear().domain(extent).range([0, 1]);
    } else {
      const domain = Array.from(new Set(values)).sort();
      return d3.scalePoint().domain(domain).range([0, 1]);
    }
  };

  const xScale = getScale(xAxis);
  const yScale = getScale(yAxis);
  const zScale = getScale(zAxis);

  // 几何体（用于公告牌效果）
  const planeGeometry = new THREE.PlaneGeometry(0.05, 0.05);

  // 为每个数据点创建节点
  props.data.forEach(d => {
    const x = xAxis ? xScale(d[xAxis]) : 0.5;
    const y = yAxis ? yScale(d[yAxis]) : 0.5;
    const z = zAxis ? zScale(d[zAxis]) : 0.5;

    let material;
    const color = colorBy ? colorScale(d[colorBy]) : '#42b883';

    // 检查是否有图片
    const imageUrl = d['Pic'] || d['image'] || d['img'];
    if (imageUrl) {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(imageUrl);
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
    } else {
        // 根据形状创建材质
        let shapeType = 'Circle';
        if (shapeBy) {
            const shapes = ['Circle', 'Ring', 'Square', 'Triangle', 'Star'];
            const val = d[shapeBy];
            const hash = Math.abs(hashCode(String(val)));
            shapeType = shapes[hash % shapes.length] || 'Circle';
        }
        
        const texture = getShapeTexture(shapeType, String(color));
        material = new THREE.MeshBasicMaterial({
            map: texture || undefined,
            color: 0xffffff, // 纹理包含颜色
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5
        });
    }

    const mesh = new THREE.Mesh(planeGeometry, material);
    mesh.position.set(Number(x), Number(y), Number(z));
    mesh.userData = d;
    
    if (scene) scene.add(mesh);
    nodes.push(mesh);
  });
};

/**
 * 设置视图方向
 * @param view - 视图方向
 */
const setView = (view: string) => {
    if (!camera || !controls) return;
    
    const dist = 2;
    const center = new THREE.Vector3(0.5, 0.5, 0.5);
    
    switch(view) {
        case 'Front': camera.position.set(0.5, 0.5, dist); break; // +Z
        case 'Back': camera.position.set(0.5, 0.5, -dist); break; // -Z
        case 'Left': camera.position.set(-dist, 0.5, 0.5); break; // -X
        case 'Right': camera.position.set(dist, 0.5, 0.5); break; // +X
        case 'Top': camera.position.set(0.5, dist, 0.5); break; // +Y
        case 'Bottom': camera.position.set(0.5, -dist, 0.5); break; // -Y
        case 'Iso': camera.position.set(dist, dist, dist); break; // 等距视角
    }
    
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
};

/**
 * 动画循环函数
 */
const animate = () => {
  animationId = requestAnimationFrame(animate);
  if (controls) controls.update();
  
  // 公告牌效果：使节点面向相机
  if (camera) {
      const quaternion = camera.quaternion;
      nodes.forEach(node => {
          node.quaternion.copy(quaternion);
      });
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

/**
 * 窗口大小调整处理函数
 */
const onWindowResize = () => {
  if (!containerRef.value || !renderer) return;
  
  // 更新相机视锥体
  updateCameraFrustum();
  
  // 更新渲染器尺寸
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  renderer.setSize(width, height);
};

/**
 * 鼠标移动处理函数（射线投射）
 * @param event - 鼠标事件
 */
const onMouseMove = (event: MouseEvent) => {
  if (!containerRef.value || !camera) return;
  
  const rect = containerRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(nodes);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    if (intersection) {
      const nodeData = (intersection.object as any).userData;
      emit('node-hover', nodeData);
      document.body.style.cursor = 'pointer';
    }
  } else {
    emit('node-hover', null);
    document.body.style.cursor = 'default';
  }
};

// 生命周期钩子
onMounted(() => {
  initThree();
  updateScene();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (renderer) renderer.dispose();
});

// 监听数据和配置变化
watch(() => [props.data, props.config], () => {
  updateScene();
}, { deep: true });

</script>

<style scoped>
/* 3D坐标系容器样式 */
.coordinate-3d {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 视图立方体控件样式 */
.view-cube {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 50px;
    height: 50px;
    perspective: 200px;
    z-index: 100;
}

/* 立方体面样式 */
.cube-face {
    position: absolute;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    cursor: pointer;
    color: #333;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.cube-face:hover {
    background: #e0e0e0;
}

/* 立方体面位置 */
.front { top: 20px; left: 20px; }
.left { top: 20px; left: 0px; }
.right { top: 20px; left: 40px; }
.top { top: 0px; left: 20px; }
.bottom { top: 40px; left: 20px; }

/* 立方体角落（重置视图） */
.cube-corner {
    position: absolute;
    top: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: #666;
    cursor: pointer;
    border-radius: 50%;
}
</style>