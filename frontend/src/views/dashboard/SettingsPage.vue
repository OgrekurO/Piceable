<template>
  <main-layout>
    <div class="settings-page">
      <h2>设置</h2>
      
      <div class="settings-section">
        <h3>用户信息</h3>
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            id="username" 
            v-model="settings.username" 
            type="text" 
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            id="email" 
            v-model="settings.email" 
            type="email" 
            class="form-control"
          />
        </div>
      </div>
      
      <div class="settings-section">
        <h3>显示设置</h3>
        <div class="form-group">
          <label for="theme">主题</label>
          <select id="theme" v-model="settings.theme" class="form-control">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="language">语言</label>
          <select id="language" v-model="settings.language" class="form-control">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>数据同步</h3>
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="settings.autoSync" 
              type="checkbox" 
              class="form-checkbox"
            />
            自动同步数据
          </label>
        </div>
        
        <div class="form-group">
          <label for="syncInterval">同步间隔（分钟）</label>
          <input 
            id="syncInterval" 
            v-model.number="settings.syncInterval" 
            type="number" 
            min="1" 
            max="60" 
            class="form-control"
          />
        </div>
      </div>
      
      <div class="form-actions">
        <button @click="saveSettings" class="btn btn-primary">保存设置</button>
        <button @click="resetSettings" class="btn btn-secondary">重置</button>
      </div>
    </div>
  </main-layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'

// 默认设置
const defaultSettings = {
  username: '',
  email: '',
  theme: 'light',
  language: 'zh',
  autoSync: false,
  syncInterval: 5
}

// 响应式数据
const settings = reactive({ ...defaultSettings })

// 保存设置
const saveSettings = () => {
  console.log('保存设置', settings)
  // TODO: 保存设置到本地存储或后端
}

// 重置设置
const resetSettings = () => {
  Object.assign(settings, defaultSettings)
  console.log('重置设置')
}
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 0.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: normal;
  cursor: pointer;
}

.form-checkbox {
  margin-right: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
</style>