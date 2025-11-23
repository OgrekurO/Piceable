import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

// 引入 Vxe-Table
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

// 引入Vxe-UI组件
import VXEUIGlobal from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'

// 引入认证存储
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)
// 使用 Vxe-Table
app.use(VXETable)
app.use(VXEUIGlobal)

// 在挂载应用前恢复认证状态
const initApp = async () => {
  const authStore = useAuthStore()
  try {
    console.log('[MAIN] 开始恢复认证状态')
    await authStore.restoreAuth()
    console.log('[MAIN] 认证状态恢复完成，isAuthenticated:', authStore.isAuthenticated)
  } catch (error) {
    console.error('[MAIN] 恢复认证状态时发生错误:', error)
  }
  
  // 挂载应用
  app.mount('#app')
  console.log('[MAIN] 应用已挂载')
}

// 初始化应用
initApp()

console.log('[FRONTEND] 应用初始化流程已启动')