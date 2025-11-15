import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import MindMapPage from '../views/MindMapPage.vue'
import TablePage from '../views/TablePage.vue'
import SettingsPage from '../views/SettingsPage.vue'

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
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    }
  ]
})

export default router