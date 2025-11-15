<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-left">
        <h1>Eagle Ontology Manager</h1>
      </div>
      
      <div class="header-center">
        <div class="search-container">
          <input 
            type="text" 
            class="search-box" 
            placeholder="搜索..." 
            v-model="searchText"
            @input="onSearch"
          />
        </div>
      </div>
      
      <div class="header-right">
        <nav>
          <router-link to="/">主页</router-link>
          <router-link to="/mindmap">思维导图</router-link>
          <router-link to="/table">表格视图</router-link>
          <router-link to="/settings">设置</router-link>
        </nav>
        
        <div class="header-actions">
          <div class="action-icon" @click="refreshData" title="刷新">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M8 3a5 5 0 1 0 4.546 7.44L15 13v-2h-2v4h4v-2h-2.793l-2.343-2.343A5 5 0 0 0 8 3zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
    
    <main class="content">
      <slot />
    </main>
    
    <footer class="footer" style="display: none;">
      <p>&copy; 2025 Eagle Ontology Manager. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 搜索文本
const searchText = ref('')

// 搜索处理函数
const onSearch = () => {
  // 发送搜索事件给子组件
  console.log('搜索:', searchText.value)
  // 这里可以使用事件总线或Vuex/Pinia状态管理来传递搜索事件
}

// 刷新数据函数
const refreshData = () => {
  console.log('刷新数据')
  // 这里可以触发全局数据刷新逻辑
}
</script>

<style scoped>
.main-layout {
  --header-height: 60px;
  
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem;
  background-color: var(--light-gray);
  border-bottom: 1px solid var(--border-color);
  height: var(--header-height);
  z-index: 100;
  box-shadow: 0 1px 0 rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  color: var(--dark-gray);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
}

.search-container {
  max-width: 400px;
  width: 100%;
  flex: 1;
  display: flex;
  justify-content: center;
  position: relative;

}

.search-box {
  padding: 5px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  width: 60%;
  max-width: 300px;
  background-color: var(--light-gray);
  transition: all 0.2s;
}

.search-box:focus {
  outline: none;
  border-color: var(--dark-gray);
  background-color: white;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header nav {
  display: flex;
  gap: 0.5rem;
}

.header a {
  text-decoration: none;
  color: var(--medium-gray);
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
}

.header a:hover,
.header a.router-link-active {
  color: var(--dark-gray);
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-icon:hover {
  background-color: #e9ecef;
}

.content {
  flex: 1;
  padding: 0;
  overflow: auto;
  height: auto;
  min-height: calc(100vh - var(--header-height));
}

.footer {
  padding: 0.8rem 1rem;
  background-color: var(--light-gray);
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--medium-gray);
  font-size: 14px;
  display: none;
}
</style>