<template>
    <div class="home-page">
      <main>
        <h1>直观编辑</h1>
        <h1>你的数据库</h1>
        <el-button type="primary" @click="createProject">创建项目</el-button>

        <!-- 创建项目弹窗组件 -->
        <CreateProjectDialog
          v-model="dialogVisible"
          @upload-file="handleUploadFile"
          @sync-eagle="handleSyncFromEagle"
        />

        <div class="table-container">
          <vxe-table class="project-table"
            :data="projects" 
            :row-config="{isHover: true}"
            :menu-config="menuConfig"
            @cell-click="handleProjectClick"
            @menu-click="handleMenuClick">
            <vxe-column type="seq" width="100" title="#" />
            <vxe-column field="name" title="项目名称" />
            <vxe-column field="description" title="项目简介" />
            <vxe-column width="200" field="date" title="最后修改时间" />
          </vxe-table>
        </div>

        <!-- 删除确认弹窗 -->
        <DeleteConfirmDialog
          v-model="deleteDialogVisible"
          :project-name="projectToDelete?.name || ''"
          :loading="deleting"
          @confirm="confirmDelete"
        />
      </main>
    </div>
  </template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
// 引入 Vxe-Table
import 'vxe-table/lib/style.css'
import {VxeTable, VxeColumn } from 'vxe-table'
import CreateProjectDialog from '@/components/editors/Project/CreateProjectDialog.vue';
import DeleteConfirmDialog from '@/components/common/feedback/DeleteConfirmDialog.vue';
import { getProjects, deleteProject } from '@/core/services/projectService';

const router = useRouter();

// 控制弹窗显示
const dialogVisible = ref(false);

// 删除确认弹窗
const deleteDialogVisible = ref(false);
const projectToDelete = ref<any>(null);
const deleting = ref(false);

// 项目数据
const projects = ref<any[]>([
  { name: '工业博物馆', date: '11月16日' },
  { name: '开水间自媒体素材', date: '11月10日' }
]);

// 右键菜单配置
const menuConfig = {
  body: {
    options: [
      [
        { code: 'delete', name: '删除项目', prefixIcon: 'vxe-icon-delete', className: 'menu-delete' }
      ]
    ]
  }
};

const createProject = () => {
  console.log('[HomePage] createProject 被调用');
  // 检查用户是否已登录
  const token = localStorage.getItem('access_token');
  console.log('[HomePage] token:', token ? '存在' : '不存在');
  if (!token) {
    // 如果未登录，跳转到登录页
    console.log('[HomePage] 未登录，跳转到登录页');
    router.push('/login');
    return;
  }
  // 显示创建项目弹窗
  console.log('[HomePage] 显示创建项目弹窗');
  dialogVisible.value = true;
};

// 上传文件选项
const handleUploadFile = async () => {
  console.log('用户选择上传文件');
  // 关闭弹窗
  dialogVisible.value = false;
  // 重新加载项目列表
  await loadProjects();
  // 跳转到表格页面
  router.push('/table?source=upload');
};

// 从Eagle同步选项
const handleSyncFromEagle = () => {
  console.log('用户选择从Eagle同步');
  // 关闭弹窗
  dialogVisible.value = false;
  // 跳转到表格页面
  router.push('/table?source=eagle');
};

// 处理项目点击事件
const handleProjectClick = ({ row }: { row: any }) => {
  console.log('[HomePage] 点击项目:', row);
  // 根据项目的 source_type 决定 source 参数
  const source = row.source_type || 'upload';
  // 跳转到项目的表格页面
  router.push(`/table?projectId=${row.id}&source=${source}`);
};

// 处理右键菜单点击
const handleMenuClick = ({ menu, row }: { menu: any; row: any }) => {
  console.log('[HomePage] 菜单点击:', menu.code, row);
  if (menu.code === 'delete') {
    // 显示删除确认弹窗
    projectToDelete.value = row;
    deleteDialogVisible.value = true;
  }
};

// 确认删除项目
const confirmDelete = async () => {
  if (!projectToDelete.value) return;
  
  deleting.value = true;
  try {
    console.log('[HomePage] 删除项目:', projectToDelete.value.id);
    await deleteProject(projectToDelete.value.id);
    
    ElMessage.success(`项目 "${projectToDelete.value.name}" 已删除`);
    
    // 关闭弹窗
    deleteDialogVisible.value = false;
    projectToDelete.value = null;
    
    // 重新加载项目列表
    await loadProjects();
  } catch (error) {
    console.error('[HomePage] 删除项目失败:', error);
    ElMessage.error('删除项目失败，请重试');
  } finally {
    deleting.value = false;
  }
};

// 加载项目列表
const loadProjects = async () => {
  try {
    console.log('[HomePage] 开始加载项目列表...');
    const data = await getProjects();
    console.log('[HomePage] 获取到项目数据:', data);
    // 转换数据格式以匹配现有表格，保留 id 和 source_type 用于导航
    projects.value = data.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      date: formatDate(project.last_modified),
      source_type: project.source_type || 'upload'  // 保留 source_type
    }));
    console.log('[HomePage] 项目列表已更新:', projects.value);
  } catch (error) {
    console.error('[HomePage] 加载项目列表失败:', error);
    // 如果是认证错误，清除 token 并跳转到登录页
    if (error instanceof Error && error.message.includes('401')) {
      localStorage.removeItem('access_token');
      router.push('/login');
    }
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return '今天';
  } else if (diffDays <= 2) {
    return '昨天';
  } else if (diffDays <= 7) {
    return `${diffDays}天前`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
};

// 组件挂载时加载项目列表
onMounted(async () => {
  // 检查用户是否已登录
  const token = localStorage.getItem('access_token');
  if (token) {
    await loadProjects();
  }
});
</script>

<style scoped>
.home-page {
  max-width: 99vw;
  padding: 20px;
  min-height: calc(100vh - var(--header-height));
}

.home-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 
    calc(100% / 30) calc(100% / 21);
  background-repeat: repeat;
  pointer-events: none;
  z-index: -1;
}

.home-page h1 {
  font-size: 18vh;
  margin-bottom: 0px;
  margin-left: 5vw;
  
}

.el-button {
  float: right;
  margin-right: 5vw;
  height: 40px;
  width: 180px;
  margin-top: -12vh; /* 根据实际需要调整 */
  font-size: 20px;
  background-color: var(--color-background);
  color: var(--color-button);
  border: var(--color-button) solid 1px;
  border-radius: 20px;
}

.table-container {
  margin-top: 50px;
  width: 99vw; /* 撑满画面左右 */
  position: relative;
  margin-left: -20px;
}

.project-table :deep .vxe-table--header-wrapper {
  background-color: var(--color-background-transparent) !important;
  font-size: 14px;
}

/* 表头样式 */
.project-table :deep .vxe-header--column {
  font-weight: bold;
  text-align: left;
  color: #575757;
  border-bottom: 1px solid var(--color-table-border);
}

/* 表格内容样式 */
.project-table :deep .vxe-body--column {
  height: 50px;
  line-height: 80px;
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text);
  padding: 0 16px;
  border-right: 1px solid var(--color-table-border);
  border-bottom: 1px solid var(--color-table-border);

}

/* 移除最后一列的右边框 */
.project-table :deep .vxe-body--column:last-child {
  border-right: none;
}

/* 表格行底部边框 */
.project-table :deep .vxe-body--row {
  border-bottom: 1px solid var(--color-table-border);
}

/* 表格行悬停效果 */
.project-table :deep .vxe-body--row:hover {
  background-color: #2ce418;
}

/* 右键菜单删除项样式 */
.project-table :deep .vxe-context-menu .menu-delete {
  color: #f56c6c;
}

.project-table :deep .vxe-context-menu .menu-delete:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>