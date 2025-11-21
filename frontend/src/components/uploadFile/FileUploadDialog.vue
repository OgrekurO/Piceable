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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElUpload, ElButton, ElIcon, ElMessage, ElLink } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { uploadFile } from '@/services/fileUploadService';
import type { UploadFile } from 'element-plus';
import { useRouter } from 'vue-router';

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
    file: null
  };
  // 重置CSV数据
  csvHeaders.value = [];
  csvData.value = [];
  autoMapping.value = {};
  userMapping.value = null;
  userMapping.value = null;
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
    
    // 关闭弹窗并触发成功事件
    closeDialog();
    emit('success');
    
    // 导航到表格页面,显示上传的数据
    if (response && response.projectId) {
      router.push(`/table?projectId=${response.projectId}&source=upload`);
    }
  } catch (error: any) {
    uploading.value = false;
    ElMessage.error(error.message || '文件上传失败');
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