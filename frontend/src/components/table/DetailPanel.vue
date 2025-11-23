<template>
  <div class="detail-panel">
    <div class="detail-header">
      <img v-if="selectedRow && selectedRow.thumbnail" :src="selectedRow.thumbnail" alt="预览" class="detail-image" />
      <div v-else class="detail-image-placeholder"></div>
    </div>
    <div class="detail-body">
      <div class="detail-item">
        <input 
          :value="selectedRow ? selectedRow.name : ''" 
          @input="updateField('name', $event)" 
          type="text" 
          placeholder="名称"
          class="centered-input"
        />
      </div>
      <div class="detail-item">
        <input 
          :value="selectedRow ? formatValue(selectedRow.folders) : ''" 
          @input="updateField('folders', $event)" 
          type="text" 
          placeholder="文件夹"
        />
      </div>
      <div class="detail-item">
        <input 
          :value="selectedRow ? formatValue(selectedRow.tags) : ''" 
          @input="updateField('tags', $event)" 
          type="text" 
          placeholder="标签"
        />
      </div>
      <div class="annotation-section">
        <div class="divider"></div>
        <div class="detail-item">
          <textarea 
            :value="selectedRow ? selectedRow.annotation : ''" 
            @input="updateField('annotation', $event)" 
            rows="3"
            placeholder="注释"
          ></textarea>
        </div>
        <div class="divider"></div>
      </div>
      <div class="detail-item meta-info">
        <input 
          :value="selectedRow ? selectedRow.lastModified : ''" 
          @input="updateField('lastModified', $event)" 
          type="text" 
          placeholder="最后修改"
          readonly
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义数据类型
interface Item {
  id: string
  thumbnail?: string
  name?: string
  folders?: string[] | string
  tags?: string[] | string
  annotation?: string
  lastModified?: number | string
  url?: string
  [key: string]: any
}

// 定义属性
const props = defineProps<{
  selectedRow: Item | null
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'field-update', field: string, event: Event): void
}>()

// 更新字段
const updateField = (field: string, event: Event) => {
  emit('field-update', field, event)
}

// 格式化数组值显示
const formatValue = (value: string[] | string | undefined): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return value
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
  display: flex;
  flex-direction: column;
  gap: 5px;

}



.detail-item input,
.detail-item textarea {
  padding: 8px;
  border: 0.5px solid var(--color-border);
  border-radius: 4px;
  font-size: 13px;
  background-color: var(--color-background);
}

.detail-item input:focus,
.detail-item textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.detail-item input::placeholder,
.detail-item textarea::placeholder {
  color: #aaa;
}

.annotation-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.divider {
  height: 0.5px;
  background-color: var(--color-border);
  margin: 5px 0;
}

.meta-info {
  margin-top: auto;
}

.meta-info input {
  color: #999;
  font-size: 12px;
}
</style>