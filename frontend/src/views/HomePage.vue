<template>
  <MainLayout>
    <div class="home-page">

      <main>
        <div class="actions">
          <router-link to="/table" class="btn primary">查看项目表格</router-link>
          <router-link to="/timeline" class="btn">查看时间线</router-link>
        </div>
      </main>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'

// 移除了自动跳转逻辑，让用户可以停留在主页
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - var(--header-height));
  background-image: linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 80px 80px; 
  background-repeat: repeat; /* 确保背景网格重复填充整个区域 */
}

header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

header p {
  font-size: 1.2rem;
  color: #666;
}


.actions {
  text-align: center;
}

.btn {
  display: inline-block;
  padding: 12px 30px;
  margin: 0 10px;
  background: #f0f0f0;
  color: #333;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s;
}

.btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover {
  background: #0069d9;
}
</style>