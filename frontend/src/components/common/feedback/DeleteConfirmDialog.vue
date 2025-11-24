<template>
  <el-dialog
    v-model="dialogVisible"
    title="删除项目"
    width="450px"
    :close-on-click-modal="false"
    class="delete-confirm-dialog">
    <div class="dialog-content">
      <div class="warning-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f56c6c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="message-content">
        <p class="main-message">确定要删除项目 <strong>{{ projectName }}</strong> 吗？</p>
        <p class="warning-text">此操作不可撤销，项目中的所有数据将被永久删除。</p>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">取消</el-button>
        <el-button type="danger" @click="handleConfirm" :loading="loading" size="large">
          删除
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  projectName: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped>
.delete-confirm-dialog :deep(.el-dialog__header) {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #eee;
}

.delete-confirm-dialog :deep(.el-dialog__body) {
  padding: 30px 20px;
}

.delete-confirm-dialog :deep(.el-dialog__footer) {
  padding: 15px 20px 20px;
  border-top: 1px solid #eee;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  text-align: center;
  width: 100%;
}

.main-message {
  font-size: 16px;
  color: #303133;
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.main-message strong {
  color: #303133;
  font-weight: 600;
}

.warning-text {
  font-size: 14px;
  color: #f56c6c;
  margin: 0;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-footer .el-button {
  min-width: 80px;
}
</style>
