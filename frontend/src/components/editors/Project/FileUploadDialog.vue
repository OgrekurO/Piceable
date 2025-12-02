<template>
  <el-dialog
    v-model="visible"
    title="上传文件创建项目"
    width="500px"
    center
    @update:model-value="handleVisibleChange"
  >
    <div class="upload-content">
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item label="项目名称" prop="projectName" :rules="[{ required: true, message: '请输入项目名称', trigger: 'blur' }]">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        
        <el-form-item label="项目描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述（可选）" 
          />
        </el-form-item>
        
        <el-form-item label="选择文件" prop="file" :rules="[{ required: true, message: '请选择文件', trigger: 'change' }]">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
            accept=".csv,.json"
          >
            <el-icon class="el-icon--upload">
              <upload-filled />
            </el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 CSV 或 JSON 格式文件
                <el-link type="primary" @click="downloadTemplate" :underline="false">下载CSV模板</el-link>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="uploading">确定</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 字段语义选择器 - 独立对话框 -->
  <FieldSemanticSelector
    v-model="showSemanticSelector"
    :fields="detectedFields"
    @confirm="handleSemanticConfirm"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElUpload, ElButton, ElIcon, ElMessage, ElLink } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { uploadFile } from '@/core/services/fileUploadService';
import type { UploadFile } from 'element-plus';
import { useRouter } from 'vue-router';
import FieldSemanticSelector from './FieldSemanticSelector.vue';
import type { FieldDefinition } from '@/core/models/schema';
import { FieldType } from '@/core/models/schema';
import { useGeocoding } from '@/composables/map/useGeocoding';

const router = useRouter();

// 定义组件属性
const props = defineProps<{
  modelValue: boolean;
  projectId: number | null;
}>();

// 定义事件发射
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

// 控制弹窗显示
const visible = ref(false);

// 表单引用
const formRef = ref();

// 表单数据
const form = ref({
  projectName: '',
  description: '',
  file: null as File | null
});

// 上传状态
const uploading = ref(false);

// 字段语义选择器
const showSemanticSelector = ref(false);
const detectedFields = ref<FieldDefinition[]>([]);
const uploadedProjectId = ref<number | null>(null);

// 地理编码
const { geocodeAddresses } = useGeocoding();

// 辅助函数：读取文件内容
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('读取文件失败'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
};

// 辅助函数：解析 CSV
const parseCSVContent = (content: string): any[] => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  
  const firstLine = lines[0];
  if (!firstLine) return [];
  
  const headers = firstLine.split(',').map(h => h.trim());
  const items: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    const item: any = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        item[header] = values[index];
      }
    });
    items.push(item);
  }
  
  return items;
};

// 辅助函数：推断字段类型
const inferFieldType = (value: any): FieldType => {
  if (value === null || value === undefined || value === '') return FieldType.TEXT;
  if (typeof value === 'boolean') return FieldType.TEXT;
  if (typeof value === 'number') return FieldType.NUMBER;
  if (!isNaN(Number(value)) && String(value).trim() !== '') return FieldType.NUMBER;
  return FieldType.TEXT;
};



// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue;
});

// 处理弹窗可见性变化
const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value);
};

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false);
  // 重置表单
  form.value = {
    projectName: '',
    description: '',
    file: null
  };
};

// 下载模板
const downloadTemplate = () => {
  const link = document.createElement('a');
  link.href = '/template.csv';
  link.download = '项目数据模板.csv';
  link.click();
};

// 处理文件选择
const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile?.raw) {
    form.value.file = uploadFile.raw;
  }
};

const handleFileRemove = () => {
  form.value.file = null;
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    if (!form.value.file) {
      ElMessage.error('请选择文件');
      return;
    }
    
    uploading.value = true;
    
    // 在上传前，先读取文件并推断 schema
    try {
      const fileContent = await readFileAsText(form.value.file);
      let items: any[] = [];
      
      if (form.value.file.name.endsWith('.csv')) {
        items = parseCSVContent(fileContent);
      } else if (form.value.file.name.endsWith('.json')) {
        items = JSON.parse(fileContent);
      }
      
      // 推断 schema
      if (items && items.length > 0) {
        const firstItem = items[0];
        const fields = Object.keys(firstItem).map(key => ({
          label: key,
          key: key,
          type: inferFieldType(firstItem[key])
        }));
        
        detectedFields.value = fields;
        console.log('[FileUploadDialog] 推断的字段:', fields);
      }
    } catch (error) {
      console.error('[FileUploadDialog] Schema 推断失败:', error);
    }
    
    // 上传文件
    const response = await uploadFile(
      form.value.file, 
      form.value.projectName, 
      undefined, 
      props.projectId,
      form.value.description || undefined
    );
    
    ElMessage.success('文件上传成功');
    uploading.value = false;
    
    // 调试：打印响应数据
    console.log('[FileUploadDialog] 上传响应:', response);
    console.log('[FileUploadDialog] Schema:', response?.schema);
    console.log('[FileUploadDialog] Fields:', response?.schema?.fields);
    
    // 检测字段并显示语义选择器
    // 优先使用前端推断的字段，或者使用后端返回的字段
    const hasFields = (detectedFields.value && detectedFields.value.length > 0) || 
                     (response?.schema?.fields && Array.isArray(response.schema.fields) && response.schema.fields.length > 0);
    
    if (hasFields) {
      console.log('[FileUploadDialog] 检测到字段，显示语义选择器');
      
      // 如果后端返回了字段，更新它（以防后端有更准确的处理）
      if (response?.schema?.fields && Array.isArray(response.schema.fields)) {
         detectedFields.value = response.schema.fields;
      }
      
      uploadedProjectId.value = response.projectId;
      
      // 关闭上传对话框
      closeDialog();
      
      // 显示字段语义选择器
      showSemanticSelector.value = true;
    } else {
      // 没有字段信息,直接跳转
      console.log('[FileUploadDialog] 未检测到字段，直接跳转');
      closeDialog();
      emit('success');
      
      if (response && response.projectId) {
        router.push(`/table?projectId=${response.projectId}&source=upload`);
      }
    }
  } catch (error: any) {
    uploading.value = false;
    ElMessage.error(error.message || '文件上传失败');
  }
};

// 引入 store
import { useProjectStore } from '@/stores/projectStore';

// 处理字段语义确认
const handleSemanticConfirm = async (fields: FieldDefinition[], enableGeocoding: boolean) => {
  try {
    // 确保在函数内部获取 store 实例，避免在 setup 之外重复调用 useProjectStore
    const projectStore = useProjectStore();
    
    // 注意：目前后端暂不支持单独更新 Schema 的语义标注，所以这里的 Schema 更新仅在当前会话的 Store 中有效
    // 且由于页面跳转后 Store 会重新加载，这些标注可能会丢失。
    // 因此，我们主要依赖地理编码的"预热"效果。
    
    // 2. 如果启用地理编码
    if (enableGeocoding && uploadedProjectId.value && form.value.file) {
      // 找到所有标记为地址的字段
      const addressFields = fields.filter(f => f.semantic_role === 'address');
      
      if (addressFields.length > 0) {
        ElMessage.info(`正在对 ${addressFields.length} 个地址字段进行地理编码...`);
        
        // 解析文件获取地址列表
        const fileContent = await readFileAsText(form.value.file);
        let items: any[] = [];
        
        if (form.value.file.name.endsWith('.csv')) {
          items = parseCSVContent(fileContent);
        } else if (form.value.file.name.endsWith('.json')) {
          items = JSON.parse(fileContent);
        }
        
        // 遍历所有地址字段
        for (const addressField of addressFields) {
          console.log(`[FileUploadDialog] 处理地址字段: ${addressField.label} (${addressField.key})`);
          
          // 提取当前字段的地址列表 (去重且非空)
          const addresses = items
            .map(item => item[addressField.key])
            .filter(addr => addr && typeof addr === 'string' && addr.trim() !== '');
            
          const uniqueAddresses = [...new Set(addresses)];
          
          if (uniqueAddresses.length > 0) {
            console.log(`[FileUploadDialog] 字段 "${addressField.label}" 提取到 ${uniqueAddresses.length} 个唯一地址，启动后台地理编码...`);
            
            // 调用地理编码 API (后台处理)
            fetch(`/api/projects/${uploadedProjectId.value}/geocode`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              },
              body: JSON.stringify({
                addresses: uniqueAddresses,
                field_name: addressField.key,
                background: true
              })
            }).then(res => {
               if (res.ok) {
                 console.log(`[FileUploadDialog] 字段 "${addressField.label}" 后台地理编码已启动`);
               }
            }).catch(err => {
               console.error(`[FileUploadDialog] 字段 "${addressField.label}" 启动后台地理编码失败:`, err);
            });
          } else {
            console.warn(`[FileUploadDialog] 字段 "${addressField.label}" 未找到有效的地址数据`);
          }
        }
        
        ElMessage.success(`已启动 ${addressFields.length} 个地址字段的后台地理编码`);
      }
    }
    
    // 触发成功事件
    emit('success');
    
    // 导航到表格页面
    if (uploadedProjectId.value) {
      router.push(`/table?projectId=${uploadedProjectId.value}&source=upload`);
    }
  } catch (error: any) {
    console.error('[FileUploadDialog] 处理失败:', error);
    ElMessage.error(error.message || '操作失败');
    // 即使失败也跳转，避免卡住
    if (uploadedProjectId.value) {
      router.push(`/table?projectId=${uploadedProjectId.value}&source=upload`);
    }
  }
};
</script>

<style scoped>
.upload-content {
  padding: 20px;
}

.upload-demo {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>