import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入 Vxe-Table
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
// 使用 Vxe-Table
app.use(VXETable)

app.mount('#app')

console.log('[FRONTEND] 应用已启动')