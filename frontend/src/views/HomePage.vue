<template>
  <div class="home-page">
    <h1>欢迎使用 Piceable</h1>
    <p>这是一个强大的图像管理工具</p>
    <div class="actions">
      <router-link to="/login" class="btn">登录</router-link>
      <router-link to="/register" class="btn">注册</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 主页组件不需要额外逻辑
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #666;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  background-color: #000000;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #333333;
}
</style>