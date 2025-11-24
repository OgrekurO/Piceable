<template>
  <div v-if="isOpen" class="annotation-form-overlay">
    <div class="annotation-form">
      <div class="form-header">
        <h3>{{ editing ? '编辑标注' : '新建标注' }}</h3>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>

      <div class="form-body">
        <div class="form-group" v-if="location">
          <label>坐标</label>
          <div class="coordinate-display">
            经度: {{ location?.lng.toFixed(6) }} | 纬度: {{ location?.lat.toFixed(6) }}
          </div>
        </div>

        <div class="form-group">
          <input 
            v-model="formData.label" 
            type="text" 
            placeholder="标注名称"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <select v-model="formData.category" class="form-select">
            <option value="default">默认</option>
            <option value="important">重要</option>
            <option value="note">笔记</option>
            <option value="question">问题</option>
          </select>
        </div>

        <div class="form-group">
          <textarea 
            v-model="formData.note" 
            placeholder="添加描述..."
            class="form-textarea"
          ></textarea>
        </div>
      </div>

      <div class="form-footer">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="submit-btn" @click="handleSubmit">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { VisualEntity } from '@/core/models/entity';

interface AnnotationFormData {
  label: string;
  note: string;
  category: string;
}

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  initialData: {
    type: Object as () => VisualEntity | null,
    default: null
  },
  location: {
    type: Object as () => { lat: number; lng: number } | undefined,
    required: false,
    default: undefined
  }
});

const emit = defineEmits(['cancel', 'submit']);

// 表单数据
const formData = ref<AnnotationFormData>({
  label: '',
  note: '',
  category: 'default'
});

// 计算是否为编辑模式
const editing = computed(() => props.initialData !== null);

// 当props更新时，同步表单数据
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    formData.value = {
      label: newVal.primaryLabel || '',
      note: newVal.data?.note || '',
      category: newVal.data?.category || 'default'
    };
  } else {
    // 新建模式重置表单
    formData.value = {
      label: '',
      note: '',
      category: 'default'
    };
  }
}, { immediate: true });

// 处理取消
const handleCancel = () => {
  emit('cancel');
};

// 处理提交
const handleSubmit = () => {
  if (!formData.value.label.trim()) {
    alert('请填写标注名称');
    return;
  }
  emit('submit', {
    label: formData.value.label,
    note: formData.value.note,
    category: formData.value.category
  });
};


</script>

<style scoped>
.annotation-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.annotation-form {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
}

.form-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #888;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.form-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.coordinate-display {
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #409eff;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: #409eff;
  color: white;
}

.submit-btn:hover {
  background: #337ecc;
}
</style>