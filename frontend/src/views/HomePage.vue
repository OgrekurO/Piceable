<template>
  <MainLayout>
    <div class="home-page">
      <header>
        <h1>Eagle Ontology Manager</h1>
        <p>基于本体论的Eagle资源管理工具</p>
      </header>

      <main>
        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>数据可视化</h3>
            <p>通过思维导图和表格形式展示Eagle资源</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>数据同步</h3>
            <p>支持与Eagle插件进行数据同步</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>HTTP API</h3>
            <p>采用HTTP API作为主要通信方式</p>
          </div>
        </div>

        <div class="actions">
          <router-link to="/items" class="btn primary">查看项目表格</router-link>
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
  height: calc(100vh - 120px); /* 减去MainLayout header的高度 */
  overflow-y: auto;
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

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.feature-card {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
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