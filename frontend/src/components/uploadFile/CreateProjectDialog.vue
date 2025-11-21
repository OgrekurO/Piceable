<template>
  <el-dialog
    v-model="visible"
    title="创建项目"
    width="500px"
    center
    @update:model-value="handleVisibleChange"
  >
    <div class="create-project-content">
      <!-- 选择创建方式 -->
      <div v-if="!selectedMode" class="mode-selection">
        <div class="mode-title">选择创建方式</div>
        <div class="options">
          <el-button class="option-btn" @click="selectMode('blank')">
            <div class="option-content">
              <el-icon size="24"><Document /></el-icon>
              <div class="option-text">
                <div class="option-title">创建空白项目</div>
                <div class="option-desc">手动添加数据</div>
              </div>
            </div>
          </el-button>
          
          <el-button class="option-btn" @click="selectMode('upload')">
            <div class="option-content">
              <el-icon size="24"><Upload /></el-icon>
              <div class="option-text">
                <div class="option-title">导入文件</div>
                <div class="option-desc">支持 CSV 或 JSON 格式</div>
              </div>
            </div>
          </el-button>
          
          <el-button class="option-btn" @click="selectMode('eagle')">
            <div class="option-content">
              <el-icon size="24"><Refresh /></el-icon>
              <div class="option-text">
                <div class="option-title">从 Eagle 同步</div>
                <div class="option-desc">同步 Eagle 插件数据</div>
              </div>
            </div>
          </el-button>
        </div>
      </div>
      
      <!-- 创建空白项目表单 -->
      <div v-else-if="selectedMode === 'blank'" class="blank-project-form">
        <el-button link @click="selectedMode = null" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <el-form :model="form" ref="formRef" label-width="100px">
          <el-form-item label="项目名称" prop="name" :rules="[{ required: true, message: '请输入项目名称', trigger: 'blur' }]">
            <el-input v-model="form.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述" prop="description">
            <el-input 
              v-model="form.description" 
              type="textarea"
              :rows="3"
              placeholder="请输入项目描述(可选)" 
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <template #footer v-if="selectedMode === 'blank'">
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleCreateBlank" :loading="creating">创建</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 文件上传对话框 -->
  <FileUploadDialog 
    v-model="uploadDialogVisible" 
    :project-id="null"
    @success="handleUploadSuccess"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElIcon, ElMessage } from 'element-plus';
import { Upload, Refresh, Document, ArrowLeft } from '@element-plus/icons-vue';
import { createProject } from '@/services/projectService';
import FileUploadDialog from '@/components/uploadFile/FileUploadDialog.vue';
import { useRouter } from 'vue-router';

// 定义组件属性
const props = defineProps<{
  modelValue: boolean;
}>();

// 定义事件发射
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'uploadFile'): void;
  (e: 'syncEagle'): void;
  (e: 'success'): void;
}>();

const router = useRouter();

// 控制弹窗显示
const visible = ref(false);

// 选择的创建模式
const selectedMode = ref<'blank' | 'upload' | 'eagle' | null>(null);

// 表单引用
const formRef = ref();

// 表单数据
const form = ref({
  name: '',
  description: ''
});

// 创建状态
const creating = ref(false);

// 文件上传对话框显示
const uploadDialogVisible = ref(false);

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue;
  if (newValue) {
    // 重置选择模式
    selectedMode.value = null;
  }
});

// 处理弹窗可见性变化
const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value);
};

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false);
  // 重置表单和模式
  selectedMode.value = null;
  form.value = {
    name: '',
    description: ''
  };
};

// 选择创建模式
const selectMode = (mode: 'blank' | 'upload' | 'eagle') => {
  selectedMode.value = mode;
  
  if (mode === 'upload') {
    // 直接打开文件上传对话框，不创建项目
    closeDialog();
    uploadDialogVisible.value = true;
  } else if (mode === 'eagle') {
    // 直接跳转到 Eagle 同步页面
    closeDialog();
    router.push('/table?source=eagle');
  }
  // 如果是 blank 模式，保持在当前对话框显示表单
};

// 处理创建空白项目
const handleCreateBlank = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    creating.value = true;
    
    // 创建空白项目
    const project = await createProject(form.value.name, form.value.description);
    
    ElMessage.success('项目创建成功');
    creating.value = false;
    
    // 关闭弹窗并触发成功事件
    closeDialog();
    emit('success');
    
    // 跳转到项目页面
    router.push(`/table?projectId=${project.id}&source=manual`);
  } catch (error: any) {
    creating.value = false;
    ElMessage.error(error.message || '项目创建失败');
  }
};

// 处理上传成功事件
const handleUploadSuccess = () => {
  uploadDialogVisible.value = false;
  emit('success');
  // FileUploadDialog 会处理跳转
};
</script>

<style scoped>
.create-project-content {
  padding: 20px;
  min-height: 200px;
}

.mode-selection {
  text-align: center;
}

.mode-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-btn {
  width: 100%;
  height: 80px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.option-btn:hover {
  border-color: #409eff;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.3);
}

.option-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.option-text {
  text-align: left;
}

.option-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.blank-project-form {
  position: relative;
}

.back-btn {
  margin-bottom: 15px;
  padding: 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>