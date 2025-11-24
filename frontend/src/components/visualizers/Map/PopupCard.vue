<template>
  <div class="popup-card">
    <div class="popup-header">
      <h3 v-if="type === 'record'">{{ (data as VisualEntity).primaryLabel }}</h3>
      <h3 v-if="type === 'annotation'">{{ (data as VisualEntity).primaryLabel }}</h3>
      <h3 v-if="type === 'search'">搜索结果: {{ (data as any).label }}</h3>
      <button class="close-btn" @click="handleClose">
        ×
      </button>
    </div>

    <div class="popup-content">
      <div v-if="type === 'record'" class="record-details">
        <div v-for="(value, key) in (data as VisualEntity).data" :key="key" class="record-field">
          <strong>{{ key }}:</strong> {{ value }}
        </div>
      </div>

      <div v-if="type === 'annotation'" class="annotation-details">
        <p><strong>描述:</strong> {{ (data as VisualEntity).data?.note }}</p>
        <p><strong>类别:</strong> {{ (data as VisualEntity).data?.category }}</p>
      </div>

      <div v-if="type === 'search'" class="search-result">
        <div v-for="(value, key) in (data as any)" :key="key" class="record-field">
          <strong>{{ key }}:</strong> {{ value }}
        </div>
      </div>
    </div>

    <div v-if="type !== 'search'" class="popup-footer">
      <button v-if="type === 'annotation'" class="edit-btn" @click="handleEdit">
        编辑
      </button>
      <button class="delete-btn" @click="handleDelete">
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { SearchResult } from '@/core/models/view';
import type { VisualEntity } from '@/core/models/entity';

const props = defineProps({
  data: {
    type: Object as () => VisualEntity | SearchResult,
    required: true
  },
  type: {
    type: String as () => 'record' | 'annotation' | 'search',
    required: true
  }
});

const emit = defineEmits(['close', 'edit', 'delete']);

const handleClose = () => {
  emit('close');
};

const handleEdit = () => {
  emit('edit');
};

const handleDelete = () => {
  emit('delete');
};
</script>

<style scoped>
.popup-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.popup-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #888;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.popup-content {
  padding: 12px 16px;
  color: #555;
}

.record-field {
  margin-bottom: 8px;
  word-break: break-word;
}

.popup-footer {
  padding: 8px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.edit-btn {
  background: #f0f0f0;
  color: #333;
}

.edit-btn:hover {
  background: #e0e0e0;
}

.delete-btn {
  background: #ffebee;
  color: #e53935;
}

.delete-btn:hover {
  background: #ffcdd2;
}
</style>