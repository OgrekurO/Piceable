<template>
  <div class="login-page">
    <div class="form-container">
      <div class="form-header">
        <h2 style="font-size: 28px; margin-bottom: 1px;">Piceable</h2>
        <p style="font-size: 12px; color: #777; margin-bottom: 28px;">欢迎回来！请输入您的账号信息。</p>
      </div>

      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名/邮箱/手机号" 
            prefix-icon="User"
            style="margin-bottom: 0px;"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            prefix-icon="Lock"
            show-password
            style="margin-bottom: 0px;"
          />
        </el-form-item>

        <el-form-item>
          <div class="link-container">
            <router-link to="/forgot-password" class="form-link">
              忘记密码？
            </router-link>
            <router-link to="/register" class="form-link">
              立即注册
            </router-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="loginLoading"
            @click="handleLogin"
            style="width: 100%; margin-bottom: 4px; font-weight: bold;"
          >
            登录
          </el-button>
        </el-form-item>

      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 获取认证存储和路由实例
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 登录表单引用
const loginFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 登录表单验证规则
const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名/邮箱/手机号', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应在 2-50 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度应在 5-20 个字符之间', trigger: 'blur' }
  ]
})

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loginLoading.value = true
      
      try {
        // 实际登录请求
        const formData = new FormData()
        formData.append("username", loginForm.username)
        formData.append("password", loginForm.password)
        
        const response = await fetch('http://localhost:8001/api/auth/token', {
          method: 'POST',
          body: formData
        })
        
        const data = await response.json()
        
        if (response.ok) {
          // 获取用户信息
          const userResponse = await fetch('http://localhost:8001/api/users/me', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`
            }
          })
          
          const userData = await userResponse.json()
          
          // 设置用户认证状态
          authStore.login(userData, data.access_token)
          
          ElMessage.success('登录成功')
          // 登录成功后返回之前的页面或主页
          const redirect = route.query.redirect || '/'
          router.push(redirect as string)
        } else {
          ElMessage.error(data.detail || '登录失败')
        }
      } catch (error) {
        console.error('登录错误:', error)
        ElMessage.error('登录过程中发生错误')
      } finally {
        loginLoading.value = false
      }
    }
  })
}

// 处理Google登录
const handleGoogleLogin = () => {
  ElMessage.info('Google登录功能尚未实现')
}

// 跳转到手机登录页面
const goToPhoneLogin = () => {
  router.push('/phone-login')
}

// 跳转到忘记密码页面
const goToForgotPassword = () => {
  router.push('/forgot-password')
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 检查是否已登录，如果已登录则重定向到主页
onMounted(() => {
  if (authStore.isAuth) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-page {
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

.link-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.form-link {
  color: var(--color-text-mute);
  font-size: 12px;
  margin-bottom: 0px;
  text-decoration: none;
}

.form-link:hover {
  color: var(--color-text);
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