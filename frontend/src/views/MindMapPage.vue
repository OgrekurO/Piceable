<template>
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-group">
          <button class="header-button" @click="refreshData">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M8 3a5 5 0 1 0 4.546 7.44L15 13v-2h-2v4h4v-2h-2.793l-2.343-2.343A5 5 0 0 0 8 3zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
            </svg>
            刷新数据
          </button>
          
          <button class="header-button" @click="exportData">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1a5 5 0 1 1 0 10A5 5 0 0 1 8 3z"/>
              <path fill="currentColor" d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
            导出数据
          </button>
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="toolbar-group">
          <input 
            v-model="filterText" 
            placeholder="筛选文件夹..." 
            class="filter-input"
          />
        </div>
      </div>
    </div>
    
    <div class="mindmap-container" ref="mindmapContainer">
      <!-- 思维导图将在此处渲染 -->
      <div v-if="loading">加载中...</div>
      <div v-else-if="error">加载失败: {{ error }}</div>
      <div v-else-if="!mindmapData">暂无数据</div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'

// 响应式数据
const mindmapContainer = ref<HTMLElement | null>(null)
const mindmapData = ref(null)
const loading = ref(false)
const error = ref<string | null>(null)
const filterText = ref('')

// 刷新数据
const refreshData = () => {
  console.log('刷新思维导图数据')
  // TODO: 从Eagle插件获取最新数据
}

// 导出数据
const exportData = () => {
  console.log('导出思维导图数据')
  // TODO: 实现数据导出功能
}

// 组件挂载后初始化
onMounted(() => {
  console.log('思维导图页面已挂载')
  // TODO: 初始化思维导图
})
</script>

<style scoped>
.toolbar {
  background: white;
  padding: 8px 15px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.1);
  display: flex;
  gap: 8px;
  align-items: center;
  overflow-x: auto;
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
  height: var(--toolbar-height);
}

.toolbar-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.mindmap-container {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 调整高度计算，减去MainLayout头部和当前组件工具栏的高度 */
  height: calc(100vh - 60px - var(--toolbar-height));
}
</style>