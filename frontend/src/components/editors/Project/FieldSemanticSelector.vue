<template>
  <el-dialog
    v-model="visible"
    title="字段语义标注"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="semantic-selector">
      <el-alert
        type="info"
        :closable="false"
        class="hint-alert"
      >
        <template #title>
          为字段选择语义角色,这将影响所有视图的数据展示
        </template>
      </el-alert>
      
      <div class="fields-list">
        <div
          v-for="field in editableFields"
          :key="field.key"
          class="field-row"
        >
          <div class="field-info">
            <span class="field-icon" v-if="field.semantic_role">
              {{ getSemanticRoleIcon(field.semantic_role) }}
            </span>
            <span class="field-label">{{ field.label }}</span>
            <el-tag v-if="field.detectedRole" size="small" type="info">
              智能推荐
            </el-tag>
          </div>
          
          <div class="field-controls">
            <el-select
              v-model="field.semantic_role"
              placeholder="选择角色"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="role in semanticRoles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              >
                <span>{{ role.icon }} {{ role.label }}</span>
              </el-option>
            </el-select>
            
            <!-- 如果选择了地址,显示地理编码选项 -->
            <el-checkbox
              v-if="field.semantic_role === 'address'"
              v-model="field.enableGeocoding"
              class="geocoding-checkbox"
            >
              自动地理编码
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FieldDefinition, FieldSemanticRole } from '@/core/models/schema'
import { useFieldSemanticDetection } from '@/composables/schema/useFieldSemanticDetection'

interface FieldWithSemantic extends FieldDefinition {
  detectedRole?: boolean  // 是否是智能检测出来的
  enableGeocoding?: boolean  // 是否启用地理编码
}

const props = defineProps<{
  modelValue: boolean
  fields: FieldDefinition[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [fields: FieldDefinition[], enableGeocoding: boolean]
}>()

const { detectSemanticRole, getSemanticRoleLabel, getSemanticRoleIcon } = useFieldSemanticDetection()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 可编辑的字段列表
const editableFields = ref<FieldWithSemantic[]>([])

// 语义角色选项
const semanticRoles = computed(() => [
  { value: 'primary_label', label: '主名称', icon: '🏷️' },
  { value: 'address', label: '地址', icon: '📍' },
  { value: 'timestamp', label: '时间', icon: '⏰' },
  { value: 'description', label: '描述', icon: '📝' },
  { value: 'image_url', label: '图片', icon: '🖼️' },
  { value: 'category', label: '分类', icon: '📂' }
])

// 监听 fields 变化,初始化可编辑字段
watch(() => props.fields, (newFields) => {
  console.log('[FieldSemanticSelector] 接收到的 fields:', newFields);
  if (newFields && newFields.length > 0) {
    editableFields.value = newFields.map(field => {
      const detectedRole = detectSemanticRole(field.label || field.key)
      return {
        ...field,
        semantic_role: field.semantic_role || detectedRole,
        detectedRole: !field.semantic_role && !!detectedRole,
        enableGeocoding: field.semantic_role === 'address'
      }
    })
    console.log('[FieldSemanticSelector] 初始化 editableFields:', editableFields.value);
  } else {
    console.log('[FieldSemanticSelector] fields 为空');
    editableFields.value = [];
  }
}, { immediate: true })

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = () => {
  // 检查是否有地址字段启用了地理编码
  const hasGeocodingEnabled = editableFields.value.some(
    f => f.semantic_role === 'address' && f.enableGeocoding
  )
  
  // 返回更新后的字段定义
  const updatedFields = editableFields.value.map(field => ({
    ...field,
    detectedRole: undefined,  // 移除临时属性
    enableGeocoding: undefined  // 移除临时属性
  }))
  
  emit('confirm', updatedFields, hasGeocodingEnabled)
  visible.value = false
}
</script>

<style scoped>
.semantic-selector {
  padding: 10px 0;
}

.hint-alert {
  margin-bottom: 20px;
}

.fields-list {
  max-height: 400px;
  overflow-y: auto;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s;
}

.field-row:hover {
  background-color: var(--el-fill-color-light);
}

.field-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.field-icon {
  font-size: 18px;
}

.field-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.field-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.geocoding-checkbox {
  margin-left: 8px;
}
</style>
