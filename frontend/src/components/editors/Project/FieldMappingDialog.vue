<template>
  <el-dialog
    v-model="visible"
    title="字段映射"
    width="600px"
    center
    @update:model-value="handleVisibleChange"
  >
    <div class="mapping-content">
      <p class="mapping-description">请为系统字段选择对应的CSV列：</p>
      
      <el-table :data="mappingFields" style="width: 100%" class="mapping-table">
        <el-table-column prop="systemField" label="系统字段" width="150">
          <template #default="scope">
            <span :class="{ required: scope.row.required }">
              {{ scope.row.label }}
              <span v-if="scope.row.required" class="required-star">*</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="CSV列">
          <template #default="scope">
            <el-select 
              v-model="scope.row.selectedColumn" 
              placeholder="请选择CSV列" 
              clearable
              style="width: 100%"
              @change="handleColumnChange(scope.row)"
            >
              <el-option
                v-for="column in csvColumns"
                :key="column"
                :label="column"
                :value="column"
              />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="mapping-info">
        <p>CSV表头: {{ csvHeaders.join(', ') }}</p>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!isMappingValid">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElDialog, ElTable, ElTableColumn, ElSelect, ElOption, ElButton, ElMessage } from 'element-plus';

// 定义组件属性
const props = defineProps<{
  modelValue: boolean;
  csvHeaders: string[];
  autoMapping: Record<string, number>;
}>();

// 定义事件发射
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', mapping: Record<string, string>): void;
}>();

// 控制弹窗显示
const visible = ref(false);

// CSV列
const csvColumns = computed(() => {
  return ['(不映射)', ...props.csvHeaders];
});

// 映射字段
const mappingFields = ref<Array<{
  systemField: string;
  label: string;
  required: boolean;
  selectedColumn: string;
}>>([
  { systemField: 'id', label: 'ID', required: false, selectedColumn: '' }, // ID字段不再必填
  { systemField: 'name', label: '名称', required: true, selectedColumn: '' },
  { systemField: 'folders', label: '文件夹', required: false, selectedColumn: '' },
  { systemField: 'tags', label: '标签', required: false, selectedColumn: '' },
  { systemField: 'annotation', label: '注释', required: false, selectedColumn: '' },
  { systemField: 'url', label: '链接', required: false, selectedColumn: '' },
  { systemField: 'lastModified', label: '最后修改时间', required: false, selectedColumn: '' },
  { systemField: 'thumbnail', label: '缩略图', required: false, selectedColumn: '' }
]);

// 检查映射是否有效
const isMappingValid = computed(() => {
  // 检查所有必填字段是否已映射
  const requiredFields = mappingFields.value.filter(field => field.required);
  return requiredFields.every(field => field.selectedColumn && field.selectedColumn !== '(不映射)');
});

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue;
  
  if (newValue) {
    // 根据自动映射结果设置默认选择
    mappingFields.value.forEach(field => {
      if (props.autoMapping[field.systemField] !== undefined) {
        const columnIndex = props.autoMapping[field.systemField];
        if (typeof columnIndex === 'number') {
           field.selectedColumn = props.csvHeaders[columnIndex] || '';
        }
      } else {
        field.selectedColumn = '';
      }
    });
  }
});

// 监听CSV表头变化
watch(() => props.csvHeaders, () => {
  // 重置选择
  mappingFields.value.forEach(field => {
    field.selectedColumn = '';
  });
});

// 处理弹窗可见性变化
const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value);
};

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false);
};

// 处理列选择变化
const handleColumnChange = (row: any) => {
  // 检查必填字段是否已选择
  if (row.required && (!row.selectedColumn || row.selectedColumn === '(不映射)')) {
    ElMessage.warning(`字段 ${row.label} 是必填的`);
  }
};

// 确认映射
const handleConfirm = () => {
  // 再次检查必填字段
  const requiredFields = mappingFields.value.filter(field => field.required);
  const missingFields = requiredFields.filter(field => !field.selectedColumn || field.selectedColumn === '(不映射)');
  
  if (missingFields.length > 0) {
    ElMessage.error(`请为必填字段 ${missingFields.map(f => f.label).join(', ')} 选择CSV列`);
    return;
  }
  
  const mapping: Record<string, string> = {};
  
  mappingFields.value.forEach(field => {
    if (field.selectedColumn && field.selectedColumn !== '(不映射)') {
      mapping[field.systemField] = field.selectedColumn;
    }
  });
  
  emit('confirm', mapping);
  closeDialog();
};
</script>

<style scoped>
.mapping-content {
  padding: 20px;
}

.mapping-description {
  font-size: 14px;
  margin-bottom: 20px;
  color: #666;
}

.mapping-table {
  margin-bottom: 20px;
}

.mapping-info {
  font-size: 12px;
  color: #999;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.required {
  font-weight: bold;
}

.required-star {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>