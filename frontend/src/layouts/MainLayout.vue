<template>
  <div class="main-layout">
    <!-- 遮罩层，点击任意地方（除了侧边页）时收回侧边页 -->
    <div 
      v-if="showSidebar" 
      class="sidebar-backdrop" 
      @click="showSidebar = false"
    ></div>
    
    <!-- 侧边页 -->
    <div class="sidebar" :class="{ open: showSidebar }">
      <div class="sidebar-content">
        <!-- 侧边页内容区域 -->
      </div>
    </div>
    
    <header class="header">
      <div class="header-left">
        <!-- 功能按钮 -->
        <div class="menu-button" @click="showSidebar = true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <!-- 点击Piceable文字返回主页 -->
        <h1 class="brand">
          <router-link to="/" class="brand-link">Piceable</router-link>
        </h1>
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
      
      <!-- 添加两根装饰竖线 -->
      <div class="decorative-lines">
        <div class="line first-line"></div>
        <div class="line second-line"></div>
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

// 控制侧边页显示状态
const showSidebar = ref(false)

// 搜索处理函数
const onSearch = () => {
  // 发送搜索事件给子组件
  console.log('搜索:', searchText.value)
  // 这里可以使用事件总线或Vuex/Pinia状态管理来传递搜索事件
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
  --header-height: 100px; /* 设置导航栏高度为固定100px */
  --border-color: #606060; /* 保持边缘线颜色 */
  --light-gray: #f8f9fa;
  --medium-gray: #aaaaaa;
  --dark-gray: #303030;
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
  border-bottom: 1.5px solid var(--border-color); /* 使用统一的颜色变量 */
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  margin-left: 35px; /* 根据规范调整功能按钮距离左侧边缘的距离 */
}

.header-left .menu-button {
  width: 40px;
  height: 40px;
  margin-right: 10px; /* 调整按钮与品牌名称之间的间距 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.brand {
  margin: 0;
  font-size: 48px; /* 调整字体大小 */
  font-weight: 900;
  font-family: 'SimHei', '黑体', 'Heiti SC', 'Microsoft YaHei', sans-serif;
  line-height: 1;
  color: #333;
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
  width: auto; /* 移除固定宽度，让文字自适应 */
  margin-left: 5px; /* 根据规范调整与功能按钮的间距 */
  padding: 0 10px; /* 添加内边距使文字更好填充容器 */
}

.brand-link {
  text-decoration: none;
  color: inherit;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  height: 30px;
  max-width: 500px; /* 设置最大宽度为500px */
  margin-left: 50px; /* 调整搜索框与“Piceable”的距离 */
}

.search-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.search-box {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  height: 100%;
  background-color: var(--light-gray);
  transition: all 0.1s;
  box-sizing: border-box;
}

.search-box:focus {
  outline: none;
  border: none;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(60, 60, 60, 0.1);
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
  height: 100%;
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
  gap: 0.1rem;
  align-items: center;
}

.auth-link {
  text-decoration: none;
  color: var(--medium-gray);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-size: 16px;
  font-weight: bold;
  background-color: transparent;
  border: none;
}

.auth-link:hover {
  color: var(--dark-gray);
  background-color: transparent;
}

.auth-link.register {
  background-color: transparent;
  color: var(--medium-gray);
  border: none;
}

.auth-link.register:hover {
  background-color: transparent;
  color: var(--dark-gray);
  border: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 添加装饰竖线样式 */
.decorative-lines {
  position: absolute;
  right: 230px; /* 调整装饰线位置 */
  top: 0;
  height: 100%;
  display: flex;
  gap: 30px;
  pointer-events: none;
  align-items: center;
}

.line {
  width: 1.5px; /* 修改装饰线粗细 */
  height: 100%;
  background-color: var(--border-color); /* 使用统一的颜色变量 */
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


.content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  height: calc(100vh - var(--header-height));
  min-height: calc(100vh - var(--header-height));
  position: relative;
}

.content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 80px 80px;
  background-repeat: repeat;
  pointer-events: none;
  z-index: -1;
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

/* 侧边页样式 */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

/* 遮罩层样式 */
.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>
