<template>
  <div class="register-page">
    <div class="form-container">
      <div class="form-header">
        <h2 style="font-size: 28px; margin-bottom: 1px;">创建账号</h2>
        <p style="font-size: 12px; color: #777; margin-bottom: 20px;">请输入您的注册信息</p>
      </div>
      
      <el-form 
        ref="registerFormRef" 
        :model="registerForm" 
        :rules="registerRules" 
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="用户名" 
            prefix-icon="User"
            style="margin-bottom: 4px;"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="邮箱地址" 
            prefix-icon="Message"
            type="email"
            style="margin-bottom: 4px;"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="密码" 
            prefix-icon="Lock"
            show-password
            style="margin-bottom: 4px;"
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="确认密码" 
            prefix-icon="Lock"
            show-password
            style="margin-bottom: 12px;"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="registerLoading"
            @click="handleRegister"
            style="width: 100%; margin-bottom: 4px; font-weight: bold;"
          >
            注册
          </el-button>
        </el-form-item>

        <div style="text-align: center; margin-top: 0px;">
          <span style="color: #777; font-size: 12px;">已有账号？</span>
          <router-link to="/login" style="color: #777; margin-left: 4px; font-size: 12px;">
            立即登录
          </router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { register as registerApi } from '@/services/authService'

// 获取认证存储和路由实例
const authStore = useAuthStore()
const router = useRouter()

// 注册表单引用
const registerFormRef = ref<FormInstance>()

// 注册加载状态
const registerLoading = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 注册表单验证规则
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在 3-20 个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在 6-20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      
      try {
        // 实际注册请求
        await registerApi({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error: any) {
        console.error('注册错误:', error)
        ElMessage.error(error.message || '注册过程中发生错误')
      } finally {
        registerLoading.value = false
      }
    }
  })
}

// 检查是否已登录，如果已登录则重定向到主页
onMounted(() => {
  if (authStore.isAuth) {
    router.push('/')
  }
})
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--color-background);
}

.form-container {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.form-header h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 28px;
}

.submit-btn {
  width: 100%;
  margin-bottom: 16px;
  background-color: var(--color-button); /* 浅灰色背景 */
  color: var(--color-text-button); /* 黑色字体 */
  border: none; /* 去除描边 */
  font-weight: bold;
}

</style>