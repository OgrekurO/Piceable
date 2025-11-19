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

const app = createApp(App)

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
// 使用 Vxe-Table
app.use(VXETable)
app.use(VXEUIGlobal)

app.mount('#app')

console.log('[FRONTEND] 应用已启动')