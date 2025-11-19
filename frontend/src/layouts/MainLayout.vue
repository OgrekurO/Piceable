<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-left">
        <h1>Piceable</h1>
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
          <router-link to="/table">表格视图</router-link>
          <router-link to="/timeline">时间线</router-link>
        </nav>
        
        <div class="auth-buttons" v-if="!authStore.isAuth">
          <router-link to="/login" class="auth-link">登录</router-link>
          <router-link to="/login" class="auth-link register">注册</router-link>
        </div>
        
        <div class="user-info" v-else>
          <span class="username">{{ authStore.currentUser?.username }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
        
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 获取认证存储和路由实例
const authStore = useAuthStore()
const router = useRouter()

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

// 处理用户登出
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 定义CSS变量 */
:root {
  --header-height: 120px;
  --border-color: #ddd;
  --light-gray: #f8f9fa;
  --medium-gray: #6c757d;
  --dark-gray: #343a40;
}

.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: var(--header-height);
  background-color: white;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.header-center {
  position: absolute;
  left: 160px;
  width: 500px;
  height: 30px;
}

.search-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.search-box {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  height: 100%;
  background-color: var(--light-gray);
  transition: all 0.2s;
  box-sizing: border-box;
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
  gap: 1.5rem;
  margin-left: auto;
}

.header nav {
  display: flex;
  gap: 1rem;
}

.header a {
  text-decoration: none;
  color: var(--medium-gray);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-size: 16px;
}

.header a:hover,
.header a.router-link-active {
  color: var(--dark-gray);
  font-weight: bold;
}

.auth-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.auth-link {
  text-decoration: none;
  color: var(--medium-gray);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-size: 16px;
  border: 1px solid var(--border-color);
}

.auth-link:hover {
  color: var(--dark-gray);
  background-color: #f0f0f0;
}

.auth-link.register {
  background-color: #007bff;
  color: white;
  border: 1px solid #007bff;
}

.auth-link.register:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 500;
  color: var(--dark-gray);
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c82333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-icon {
  width: 36px;
  height: 36px;
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
  overflow: hidden;
  height: calc(100vh - var(--header-height));
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