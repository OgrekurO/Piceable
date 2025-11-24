<template>
  <div class="forgot-password-page">
    <div class="form-container">
      <div class="form-header">
        <h2 style="font-size: 28px; margin-bottom: 1px;">忘记密码</h2>
        <p style="font-size: 12px; color: #777; margin-bottom: 24px;">请输入您的账号信息和新密码</p>
      </div>
      
      <el-form 
        ref="forgotFormRef" 
        :model="forgotForm" 
        :rules="forgotRules" 
        class="forgot-password-form"
        @submit.prevent="handleResetPassword"
      >
        <el-form-item prop="account">
          <el-input 
            v-model="forgotForm.account" 
            placeholder="用户名/邮箱/手机号" 
            prefix-icon="User"
            style="margin-bottom: 4px;"
          />
        </el-form-item>
        
        <el-form-item prop="code" class="code-item">
          <el-input 
            v-model="forgotForm.code" 
            placeholder="验证码" 
            prefix-icon="Lock"
            style="margin-bottom: 4px;"
          />
          <el-button 
            class="code-button" 
            :disabled="codeButtonDisabled"
            @click="getCode"
            style="position: absolute; right: 0px; top: 0px; bottom: 0px; border-top-left-radius: 0; border-bottom-left-radius: 0; "
          >
            {{ codeButtonText }}
          </el-button>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="forgotForm.password" 
            type="password" 
            placeholder="新密码" 
            prefix-icon="Lock"
            show-password
            style="margin-bottom: 4px;"
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="forgotForm.confirmPassword" 
            type="password" 
            placeholder="确认新密码" 
            prefix-icon="Lock"
            show-password
            style="margin-bottom: 4px;"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="resetLoading"
            @click="handleResetPassword"
            style="width: 100%; margin-bottom: 4px; font-weight: bold;"
          >
            重置密码
          </el-button>
        </el-form-item>

        <div style="text-align: center; margin-top: 4px;">
          <span style="color: #777; font-size: 12px;">已有账号？</span>
          <router-link to="/login" style="color: #777; font-weight: bold; margin-left: 4px; font-size: 12px;">
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

// 获取路由实例
const router = useRouter()

// 忘记密码表单引用
const forgotFormRef = ref<FormInstance>()

// 重置密码加载状态
const resetLoading = ref(false)

// 验证码按钮状态
const codeButtonDisabled = ref(false)
const codeButtonText = ref('获取验证码')
let countdown = 60

// 忘记密码表单数据
const forgotForm = reactive({
  account: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 忘记密码表单验证规则
const forgotRules = reactive<FormRules>({
  account: [
    { required: true, message: '请输入用户名/邮箱/手机号', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应在 2-50 个字符之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在 6-20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== forgotForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 获取验证码
const getCode = async () => {
  if (!forgotFormRef.value) return
  
  // 验证账号
  await forgotFormRef.value.validateField('account', (isValid) => {
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
      ElMessage.error('请输入正确的账号信息')
    }
  })
}

// 处理重置密码
const handleResetPassword = async () => {
  if (!forgotFormRef.value) return
  
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      resetLoading.value = true
      
      try {
        // 实际重置密码请求
        // 注意：这里应该调用后端的重置密码接口
        ElMessage.success('密码重置成功，请重新登录')
        
        // 重置成功后跳转到登录页面
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } catch (error) {
        console.error('重置密码错误:', error)
        ElMessage.error('重置密码过程中发生错误')
      } finally {
        resetLoading.value = false
      }
    }
  })
}

// 脚本部分无需修改，已使用 router-link 实现跳转

// 检查是否已登录，如果已登录则重定向到主页
onMounted(() => {
  // 这里可以添加检查是否已登录的逻辑
})
</script>

<style scoped>
.forgot-password-page {
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
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
}

.form-header h2 {
  margin: 0;
  color:var(--color-text);
  font-size: 28.8px;
}

.submit-btn {
  width: 100%;
  margin-bottom: 16px;
}

/* 确保primary按钮样式与登录页面一致 */
:deep(.el-button--primary) {
  background-color: var(--light-gray);
  color: #000000; /* 黑色字体 */
  border: none; /* 去除描边 */
  font-weight: bold;
}
</style>