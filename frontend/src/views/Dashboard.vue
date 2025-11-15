<template>
  <div class="dashboard">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>Eagle Ontology Manager Dashboard</h1>
          <el-button @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-main>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="图像管理" name="images">
            <div class="tab-content">
              <h2>图像属性管理</h2>
              <p>这里将显示图像属性管理界面</p>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="属性结构" name="attributes">
            <div class="tab-content">
              <h2>属性结构管理</h2>
              <p>这里将显示属性结构管理界面</p>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="可视化" name="visualization">
            <div class="tab-content">
              <h2>数据可视化</h2>
              <p>这里将显示数据可视化界面</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('images')

const handleLogout = () => {
  localStorage.removeItem('token')
  ElMessage.info('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.tab-content {
  padding: 20px;
}
</style>