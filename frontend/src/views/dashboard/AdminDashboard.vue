<template>
  <div class="admin-dashboard">
    <h1>管理员控制台</h1>
    
    <el-tabs v-model="activeTab" class="admin-tabs">
      <el-tab-pane label="用户管理" name="users">
        <div class="users-management">
          <el-card class="users-card">
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
                <el-button type="primary" @click="fetchUsers">刷新</el-button>
              </div>
            </template>
            
            <el-table :data="users" style="width: 100%" v-loading="loading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column label="角色">
                <template #default="scope">
                  <el-tag :type="scope.row.roleId === 1 ? 'danger' : 'success'">
                    {{ scope.row.roleId === 1 ? '管理员' : '普通用户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="isActive" label="状态">
                <template #default="scope">
                  <el-tag :type="scope.row.isActive ? 'success' : 'warning'">
                    {{ scope.row.isActive ? '激活' : '未激活' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    :type="scope.row.roleId === 1 ? 'warning' : 'primary'"
                    @click="changeUserRole(scope.row)"
                    :disabled="scope.row.username === 'admin'"
                  >
                    {{ scope.row.roleId === 1 ? '降为用户' : '设为管理员' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="系统设置" name="settings">
        <div class="settings-management">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>系统设置</span>
              </div>
            </template>
            
            <div class="settings-content">
              <p>系统设置功能正在开发中...</p>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { User } from '@/types'
import { getAllUsers, updateUserRole, isAdmin } from '@/core/services/authService'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const activeTab = ref('users')
const users = ref<User[]>([])
const loading = ref(false)
const authStore = useAuthStore()
const router = useRouter()

// 检查用户权限
onMounted(() => {
  if (!authStore.user || !isAdmin(authStore.user)) {
    ElMessage.error('权限不足')
    router.push('/')
    return
  }
  fetchUsers()
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const userList = await getAllUsers()
    if (userList) {
      users.value = userList
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 更改用户角色
const changeUserRole = async (user: User) => {
  // 确认对话框
  ElMessageBox.confirm(
    `确定要将用户 "${user.username}" ${user.roleId === 1 ? '降为普通用户' : '设为管理员'} 吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    // 执行角色更改
    const newRoleId = user.roleId === 1 ? 2 : 1
    const result = await updateUserRole(user.id, newRoleId)
    
    if (result.success) {
      ElMessage.success('角色更新成功')
      // 更新本地数据
      const index = users.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        users.value[index] = { ...users.value[index], roleId: newRoleId }
      }
    } else {
      ElMessage.error(result.message || '角色更新失败')
    }
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  height: calc(100vh - 60px);
  overflow: auto;
}

.admin-dashboard h1 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-content {
  padding: 20px 0;
}

/* 将按钮的蓝色替换为base.css中的统一黑色 */
.black-button {
  background-color: var(--vt-c-black) !important;
  border-color: var(--vt-c-black) !important;
  color: var(--vt-c-white) !important;
}

.black-button:hover {
  background-color: var(--vt-c-black-soft) !important;
  border-color: var(--vt-c-black-soft) !important;
  color: var(--vt-c-white) !important;
}

/* 将标签的蓝色替换为base.css中的统一黑色 */
.black-tag {
  background-color: var(--vt-c-black) !important;
  border-color: var(--vt-c-black) !important;
  color: var(--vt-c-white) !important;
}

/* 修改标签页的蓝色边框为base.css中的统一黑色 */
:deep(.el-tabs__item.is-active) {
  color: var(--vt-c-black) !important;
}

:deep(.el-tabs__active-bar) {
  background-color: var(--vt-c-black) !important;
}

:deep(.el-button--primary) {
  background-color: var(--vt-c-black) !important;
  border-color: var(--vt-c-black) !important;
  color: var(--vt-c-white) !important;
}

:deep(.el-button--primary:hover) {
  background-color: var(--vt-c-black-soft) !important;
  border-color: var(--vt-c-black-soft) !important;
  color: var(--vt-c-white) !important;
}

:deep(.el-table__row .el-button--primary) {
  background-color: var(--vt-c-black) !important;
  border-color: var(--vt-c-black) !important;
  color: var(--vt-c-white) !important;
}

:deep(.el-table__row .el-button--primary:hover) {
  background-color: var(--vt-c-black-soft) !important;
  border-color: var(--vt-c-black-soft) !important;
  color: var(--vt-c-white) !important;
}
</style>