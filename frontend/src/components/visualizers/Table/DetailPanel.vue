<template>
  <div class="detail-panel">
    <!-- 顶部图片区域 -->
    <div class="detail-header">
      <img v-if="selectedRow && (selectedRow.data?.thumbnail || selectedRow.thumbnail)" :src="selectedRow.data?.thumbnail || selectedRow.thumbnail" alt="预览" class="detail-image" />
      <div v-else class="detail-image-placeholder"></div>
    </div>
    
    <div class="detail-body">
      <!-- 动态渲染所有字段 -->
      <div 
        v-for="col in displayColumns" 
        :key="col.field"
        :class="col.field === 'annotation' ? 'annotation-section' : 'detail-item'"
      >
        <!-- 分隔线（注释前） -->
        <div v-if="col.field === 'annotation'" class="divider"></div>
        
        <!-- 缩略图字段跳过（已在header显示） -->
        <template v-if="col.field !== 'thumbnail'">
          <!-- 注释字段 (Textarea) -->
          <div v-if="col.field === 'annotation'" class="detail-item">
            <textarea 
              :value="selectedRow ? (selectedRow.data?.[col.field] || selectedRow[col.field] || '') : ''" 
              @input="updateField(col.field, $event)" 
              @change="save"
              rows="3"
              :placeholder="col.title"
            ></textarea>
          </div>
          
          <!-- 其他字段 (Input) -->
          <input 
            v-else
            :value="selectedRow ? formatValue(selectedRow.data?.[col.field] || selectedRow[col.field]) : ''" 
            @input="updateField(col.field, $event)" 
            @change="save"
            type="text" 
            :placeholder="col.title"
            :class="{ 
              'centered-input': col.field === 'name',
              'meta-info': col.field === 'lastModified'
            }"
            :readonly="col.field === 'lastModified'"
          />
        </template>
        
        <!-- 分隔线（注释后） -->
        <div v-if="col.field === 'annotation'" class="divider"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, watch, computed, ref } from 'vue'

interface Item {
  id: string | number
  thumbnail?: string
  [key: string]: any
}

// 定义属性
const props = defineProps<{
  selectedRow: Item | null
  columns?: any[]
}>()

// Debug logging
watch(() => props.selectedRow, (newVal) => {
  console.log('[DetailPanel] selectedRow changed:', newVal)
})
watch(() => props.columns, (newVal) => {
  console.log('[DetailPanel] columns changed:', newVal)
}, { immediate: true })

// 计算显示的列：如果 props.columns 存在则使用，否则从 selectedRow 生成
const displayColumns = computed(() => {
  if (props.columns && props.columns.length > 0) {
    return props.columns
  }
  
  if (props.selectedRow) {
    // Fallback: generate columns from row keys
    return Object.keys(props.selectedRow)
      .filter(key => key !== 'id' && key !== 'data') // Filter out internal fields if needed
      .map(key => ({
        field: key,
        title: key.charAt(0).toUpperCase() + key.slice(1) // Simple title generation
      }))
  }
  
  return []
})

// 定义事件
const emit = defineEmits<{
  (e: 'field-update', field: string, event: Event): void
  (e: 'save'): void
}>()

// 更新字段
const updateField = (field: string, event: Event) => {
  emit('field-update', field, event)
}

// 保存
const save = () => {
  emit('save')
}

// 格式化数组值显示
const formatValue = (value: string[] | string | undefined): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return String(value)
}
</script>

<style scoped>
.detail-panel {
  width: 100%;
  background-color: var(--color-background);
  padding: 20px;
  border-left: 1px solid var(--color-border);
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.detail-image-placeholder {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  outline: var(--color-border) 0.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  margin-bottom: 6px;
}

.detail-item input,
.detail-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.detail-item input:focus,
.detail-item textarea:focus {
  border-color: var(--color-primary);
  outline: none;
}

.centered-input {
  text-align: center;
  font-weight: bold;
  font-size: 16px !important;
  border: none !important;
  background: transparent;
  margin-bottom: 10px;
}

.annotation-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.divider {
  height: 0.5px;
  background-color: var(--color-border);
  margin: 10px 0;
}

.meta-info {
  color: #999;
  font-size: 12px;
  text-align: right;
}

.detail-item.meta-info {
  margin-top: auto;
}
</style>