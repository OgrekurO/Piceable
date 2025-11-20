<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-left">
        <!-- 功能按钮 -->
        <div class="menu-button" @click="toggleSidebar">
          <svg v-if="!showSidebar" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <!-- 点击Piceable文字返回主页 -->
        <span class="logo">
          <router-link to="/" class="logo-link">Piceable</router-link>
        </span>
      </div>
      
      <div class="header-center">
        <!-- 搜索框 -->
        <div class="search-container" v-show="!showSidebar">
          <input 
            type="text" 
            class="search-box" 
            placeholder="搜索..." 
            v-model="searchText"
            @input="onSearch"
          />
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- 导航链接 -->
        <div class="nav-links" v-show="showSidebar">
          <router-link to="/timeline" class="nav-link" @click="showSidebar = false">时间轴</router-link>
          <router-link to="/table" class="nav-link" @click="showSidebar = false">表格</router-link>
          <router-link to="/mindmap" class="nav-link" @click="showSidebar = false">图谱</router-link>
          <router-link to="/map" class="nav-link" @click="showSidebar = false">地图</router-link>
        </div>
      </div>
      
      <div class="header-right">
        <div class="auth-buttons" v-if="!authStore.isAuth">
          <router-link to="/login" class="auth-link login">登录</router-link>
          <router-link to="/login" class="auth-link register">注册</router-link>
        </div>
        
        <div class="user-info" v-else>
          <div class="user-dropdown" @click="toggleUserDropdown">
            <span class="username">{{ authStore.currentUser?.username }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="dropdown-icon">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <!-- 下拉菜单 -->
            <div class="user-dropdown-menu" v-show="showUserDropdown">
              <router-link to="/admin" class="dropdown-item" v-if="authStore.currentUser?.roleId === 1">管理面板</router-link>
              <router-link to="/settings" class="dropdown-item">设置</router-link>
              <button class="dropdown-item logout-btn" @click="handleLogout">退出</button>
            </div>
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

// 控制导航链接显示状态
const showSidebar = ref(false)

// 控制用户下拉菜单显示状态
const showUserDropdown = ref(false)

// 切换导航链接显示状态
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 切换用户下拉菜单显示状态
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// 搜索处理函数
const onSearch = () => {
  // 发送搜索事件给子组件
  console.log('搜索:', searchText.value)
  // 这里可以使用事件总线或Vuex/Pinia状态管理来传递搜索事件
}

// 处理用户登出
const handleLogout = () => {
  showUserDropdown.value = false
  authStore.logout()
  router.push('/login')
}

// 点击其他地方关闭用户下拉菜单
document.addEventListener('click', (event) => {
  const userDropdown = document.querySelector('.user-dropdown')
  if (userDropdown && !userDropdown.contains(event.target as Node)) {
    showUserDropdown.value = false
  }
})
</script>

<style scoped>
/* 定义CSS变量 */
:root {
  --header-height: 1vh; /* 设置导航栏高度为固定100px */
}

.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: var(--header-height);
  background-color: var(--color-background);
  border-bottom: 1.5px solid var(--border-color); /* 使用统一的颜色变量 */
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left .menu-button {
  width: 40px;
  height: 40px;
  margin-right: 10px; /* 调整按钮与品牌名称之间的间距 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text);
}

.logo {
  display: flex;
  align-items: center;
  overflow: hidden;
  width: auto; /* 移除固定宽度，让文字自适应 */
}

.logo-link {
  color: var(--color-text);
  font-size: 20px; /* 调整字体大小 */
  font-weight: bold;
  font-family: 'SimHei', '黑体', 'Heiti SC', 'Microsoft YaHei', sans-serif;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 0 auto; /* 居中对齐 */
}

.search-container {
  width: 40%;
  height: 30px;
  position: relative;
  min-width: 200px; /* 设置最小宽度 */
}

.search-box {
  padding: 6px 30px 6px 10px; /* 为图标留出空间 */
  border: none;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  height: 100%;
  background-color: var(--vt-c-white-mute);
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

.search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--medium-gray);
  pointer-events: none; /* 图标不响应鼠标事件 */
}

.nav-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  width: 100%;
  height: 30px;
  min-width: 200px; /* 设置最小宽度 */
}

.nav-link {
  text-decoration: none;
  color: var(--color-text);
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.nav-link:hover{
  color: var(--color-text);
  font-weight: bold;
}


.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
  height: 100%;
  position: relative;
}


.auth-buttons {
  display: flex;
  gap: 0.1rem;
  align-items: center;
}

.auth-link {
  text-decoration: none;
  color: var(--color-text);
  padding: 0rem 0.5rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-size: 16px;
  background-color: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-link:hover {
  color: var(--color-text);
  background-color: transparent;
}

.auth-link.login {
  background-color: transparent;
  color: var(--color-text-mute);
  border: none;
}

.auth-link.login:hover {
  background-color: transparent;
  color: var(--color-text);
  border: none;
}

.auth-link.register {
  background-color: transparent;
  color: var(--color-text-mute);
  border: none;
}

.auth-link.register:hover {
  background-color: transparent;
  color: var(--color-text);
  border: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: var(--color-background);
}

.username {
  font-weight: 500;
  font-size: 16px;
  color: var(--color-text);
}

.dropdown-icon {
  transition: transform 0.3s;
}

.user-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--color-background);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  z-index: 1000;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--color-text-mute);
  font-size: 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 0;
}

.dropdown-item:hover {
  background-color: var(--color-text);
  color: #000;
}

.dropdown-item.logout-btn {
  color: var(--danger-color);
  font-weight: normal;
}

.dropdown-item.logout-btn:hover {
  background-color: #f8d7da;
  color: var(--danger-color);
}

.logout-btn {
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: var(--danger-color);
}

.content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  height: calc(100vh - var(--header-height));
  min-height: calc(100vh - var(--header-height));
  position: relative;
  margin-top: 0;
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
  background-size: 
    calc(100% / 30) calc(100% / 21);
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

/* 媒体查询：当屏幕宽度较小时隐藏搜索框 */
@media (max-width: 600px) {
  .search-container {
    display: none;
  }
  
  .nav-links {
    width: auto;
    min-width: unset;
  }
}
</style>