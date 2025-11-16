<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <el-button @click="handleRefresh" size="small" icon="Refresh">刷新</el-button>
      <el-input 
        v-model="searchTextLocal" 
        placeholder="搜索..." 
        size="small" 
        style="width: 500px; margin-left: 10px;"
        clearable
        @clear="handleSearchClear"
        @input="handleSearchInput"
      />
    </div>
    <div class="toolbar-right">
      <!-- 分页组件 -->
      <vxe-pager 
        v-if="pagerConfig"
        v-bind="pagerConfig"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PagerEvents } from 'vxe-pc-ui'
import type { VxeGridPropTypes } from 'vxe-table'

// 定义属性
const props = defineProps<{
  searchText: string
  pagerConfig?: VxeGridPropTypes.PagerConfig
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'update:searchText', value: string): void
  (e: 'page-change', value: PagerEvents.PageChange): void
}>()

// 本地搜索文本
const searchTextLocal = ref(props.searchText)

// 监听搜索文本变化
watch(() => props.searchText, (newVal) => {
  searchTextLocal.value = newVal
})

// 处理刷新
const handleRefresh = () => {
  emit('refresh')
}

// 处理搜索输入
const handleSearchInput = () => {
  emit('update:searchText', searchTextLocal.value)
}

// 处理搜索清除
const handleSearchClear = () => {
  searchTextLocal.value = ''
  emit('update:searchText', '')
}

// 处理页面变化
const handlePageChange: PagerEvents.PageChange = (params) => {
  emit('page-change', params)
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  min-height: 40px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  flex-shrink: 0;
}
</style>