<template>
  <div class="toolbar">
    <div class="logo-section">
      <img src="@/assets/logo.svg" alt="Logo" class="logo" />
      <span class="app-name">Eagle 图谱管理</span>
    </div>
    
    <div class="nav-section">
      <el-menu 
        :default-active="activeIndex" 
        mode="horizontal" 
        :ellipsis="false"
        @select="handleSelect"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/items">项目管理</el-menu-item>
        <el-menu-item index="/timeline">时间线</el-menu-item>
        <el-menu-item 
          v-if="authStore.user && isAdmin(authStore.user)" 
          index="/admin"
        >
          管理员控制台
        </el-menu-item>
      </el-menu>
    </div>
    
    <div class="user-section">
      <div v-if="authStore.isAuthenticated" class="user-info">
        <el-dropdown @command="handleUserCommand">
          <span class="el-dropdown-link">
            {{ authStore.user?.username }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div v-else>
        <el-button @click="$router.push('/login')">登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { isAdmin } from '@/services/authService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeIndex = ref('/')

// 监听路由变化，更新激活的菜单项
watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath
  },
  { immediate: true }
)

const handleSelect = (key: string) => {
  router.push(key)
}

const handleUserCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } else if (command === 'profile') {
    // 个人资料功能可以在这里实现
    ElMessage.info('个人资料功能正在开发中')
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  margin-right: 10px;
}

.app-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.nav-section {
  flex: 1;
  margin: 0 20px;
}

.user-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
}
</style>