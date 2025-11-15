<template>
  <div class="communication-selector">
    <h3>通信设置</h3>
    <div class="method-selector">
      <div 
        class="method-card" 
        :class="{ active: modelValue === 'httpapi' }"
        @click="$emit('update:modelValue', 'httpapi')"
      >
        <div class="method-icon">🌐</div>
        <div class="method-name">HTTP API</div>
        <div class="method-description">通过HTTP API与插件通信</div>
      </div>
    </div>
    
    <div class="status-info">
      <div class="status-item">
        <span class="label">当前通信方式:</span>
        <span class="value">{{ modelValue === 'httpapi' ? 'HTTP API' : '未知' }}</span>
      </div>
      
      <div class="status-item" v-if="modelValue === 'httpapi'">
        <span class="label">HTTP服务器:</span>
        <span class="value" :class="httpServerStatus ? 'success' : 'error'">
          {{ httpServerStatus ? '已连接' : '未连接' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { isHttpServerAvailable } from '../services/pluginCommunication'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const httpServerStatus = ref(false)

// 检查HTTP服务器状态
const checkHttpServerStatus = async () => {
  if (props.modelValue === 'httpapi') {
    httpServerStatus.value = await isHttpServerAvailable()
  }
}

onMounted(() => {
  checkHttpServerStatus()
})

watch(() => props.modelValue, () => {
  checkHttpServerStatus()
})

// 定期检查HTTP服务器状态
setInterval(() => {
  checkHttpServerStatus()
}, 5000)
</script>

<style scoped>
.communication-selector {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.method-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.method-card {
  flex: 1;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
}

.method-card:hover {
  border-color: #007acc;
}

.method-card.active {
  border-color: #007acc;
  background: #e1f0fa;
}

.method-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.method-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.method-description {
  font-size: 14px;
  color: #666;
}

.status-info {
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
}

.value.success {
  color: #0a0;
}

.value.error {
  color: #f00;
}
</style>