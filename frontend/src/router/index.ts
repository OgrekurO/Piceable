import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import MindMapPage from '../views/MindMapPage.vue'
import TablePage from '../views/TablePage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import LoginRegisterPage from '../views/LoginRegisterPage.vue'
import TimeLine from '@/views/TimeLine.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/mindmap',
      name: 'mindmap',
      component: MindMapPage
    },
    {
      path: '/table',
      name: 'table',
      component: TablePage
    },
        {
      path: '/timeline',
      name: 'timeline',
      component: TimeLine
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    },
    {
      path: '/login',
      name: 'login',
      component: LoginRegisterPage
    }
  ]
})

export default router