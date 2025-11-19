<template>
  <div class="login-register-page">
    <div class="form-container">
      <div class="form-header">
        <h2>{{ activeTab === 'login' ? '用户登录' : '用户注册' }}</h2>
      </div>
      
      <el-tabs v-model="activeTab" class="login-register-tabs" @tab-change="onTabChange">
        <el-tab-pane label="登录" name="login">
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
                placeholder="请输入用户名" 
                prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                class="submit-btn" 
                :loading="loginLoading"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
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
                placeholder="请输入用户名" 
                prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="email">
              <el-input 
                v-model="registerForm.email" 
                placeholder="请输入邮箱地址" 
                prefix-icon="Message"
                type="email"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="请输入密码" 
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item prop="confirmPassword">
              <el-input 
                v-model="registerForm.confirmPassword" 
                type="password" 
                placeholder="请确认密码" 
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                class="submit-btn" 
                :loading="registerLoading"
                @click="handleRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'
import { login as loginApi, register as registerApi, getCurrentUser } from '@/services/authService'

// 获取认证存储和路由实例
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 活动标签页
const activeTab = ref('login')

// 登录表单引用
const loginFormRef = ref<FormInstance>()
// 注册表单引用
const registerFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)
// 注册加载状态
const registerLoading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 登录表单验证规则
const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在 2-20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度应在 5-20 个字符之间', trigger: 'blur' }
  ]
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

// 处理标签页切换
const onTabChange = (tabName: string) => {
  activeTab.value = tabName
}

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
        activeTab.value = 'login'
        
        // 清空注册表单
        registerForm.username = ''
        registerForm.email = ''
        registerForm.password = ''
        registerForm.confirmPassword = ''
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
.login-register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.form-container {
  width: 100%;
  max-width: 450px;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 20px;
}

.form-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.login-register-tabs {
  width: 100%;
}

.submit-btn {
  width: 100%;
}
</style>