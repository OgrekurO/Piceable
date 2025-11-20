<template>
  <div class="phone-login-page">
    <div class="form-container">
      <div class="form-header">
        <h2 style="font-size: 28.8px; margin-bottom: 8px;">手机登录</h2>
        <p style="font-size: 12.8px; color: #777; margin-bottom: 24px;">请输入您的手机号和验证码</p>
      </div>
      
      <el-form 
        ref="phoneFormRef" 
        :model="phoneForm" 
        :rules="phoneRules" 
        class="phone-login-form"
        @submit.prevent="handlePhoneLogin"
      >
        <el-form-item prop="phoneNumber">
          <el-input 
            v-model="phoneForm.phoneNumber" 
            placeholder="手机号" 
            prefix-icon="Iphone"
            style="margin-bottom: 16px;"
          />
        </el-form-item>
        
        <el-form-item prop="code" class="code-item">
          <el-input 
            v-model="phoneForm.code" 
            placeholder="验证码" 
            prefix-icon="Lock"
            style="margin-bottom: 16px;"
          />
          <el-button 
            class="code-button" 
            :disabled="codeButtonDisabled"
            @click="getCode"
            style="position: absolute; right: 1px; top: 1px; bottom: 1px; border-top-left-radius: 0; border-bottom-left-radius: 0; height: calc(100% - 2px);"
          >
            {{ codeButtonText }}
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="loginLoading"
            @click="handlePhoneLogin"
            style="width: 100%; margin-bottom: 16px;"
          >
            登录
          </el-button>
        </el-form-item>

        <div style="text-align: center; margin-top: 16px;">
          <router-link to="/login" style="color: #409EFF; font-weight: bold; font-size: 12.8px;">
            使用账号密码登录
          </router-link>
        </div>
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

// 手机登录表单引用
const phoneFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)

// 验证码按钮状态
const codeButtonDisabled = ref(false)
const codeButtonText = ref('获取验证码')
let countdown = 60

// 手机登录表单数据
const phoneForm = reactive({
  phoneNumber: '',
  code: ''
})

// 手机登录表单验证规则
const phoneRules = reactive<FormRules>({
  phoneNumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
})

// 获取验证码
const getCode = async () => {
  if (!phoneFormRef.value) return
  
  // 验证手机号
  await phoneFormRef.value.validateField('phoneNumber', (isValid) => {
    if (isValid) {
      // 启动倒计时
      codeButtonDisabled.value = true
      const timer = setInterval(() => {
        if (countdown > 0) {
          codeButtonText.value = `${countdown}秒后重试`
          countdown--
        } else {
          codeButtonText.value = '获取验证码'
          codeButtonDisabled.value = false
          countdown = 60
          clearInterval(timer)
        }
      }, 1000)
      
      // 实际发送验证码请求
      ElMessage.success('验证码已发送，请注意查收')
    } else {
      ElMessage.error('请输入正确的手机号')
    }
  })
}

// 处理手机登录
const handlePhoneLogin = async () => {
  if (!phoneFormRef.value) return
  
  await phoneFormRef.value.validate(async (valid) => {
    if (valid) {
      loginLoading.value = true
      
      try {
        // 实际手机登录请求
        // 注意：这里应该调用后端的手机登录接口
        ElMessage.success('登录成功')
        
        // 模拟登录成功后的操作
        // 在实际应用中，这里应该获取真实的用户信息和token
        setTimeout(() => {
          authStore.login({
            id: 1,
            username: 'user',
            email: '',
            is_active: true,
            is_superuser: false
          }, 'fake_token')
          
          // 登录成功后返回之前的页面或主页
          const redirect = route.query.redirect || '/'
          router.push(redirect as string)
        }, 1000)
      } catch (error) {
        console.error('登录错误:', error)
        ElMessage.error('登录过程中发生错误')
      } finally {
        loginLoading.value = false
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
.phone-login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: white;
}

.form-container {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
}

.form-header h2 {
  margin: 0;
  color: #333;
  font-size: 28.8px;
}

.submit-btn {
  width: 100%;
  margin-bottom: 16px;
}
</style>