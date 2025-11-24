<template>
  <div class="table-tabs" v-if="tables.length > 0">
    <div 
      v-for="table in tables" 
      :key="table.id" 
      class="tab-item"
      :class="{ active: currentTableId === table.id }"
      @click="handleTabClick(table.id)"
    >
      {{ table.name }}
    </div>
    <div class="tab-add" @click="handleAddClick">
      +
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Table } from '@/types/schema'

interface Props {
  tables: Table[]
  currentTableId: number | null
}

interface Emits {
  (e: 'switch', tableId: number): void
  (e: 'add'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleTabClick = (tableId: number) => {
  emit('switch', tableId)
}

const handleAddClick = () => {
  emit('add')
}
</script>

<style scoped>
.table-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 10px;
  height: 40px;
  align-items: flex-end;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  background-color: #e6e6e6;
  color: #666;
  font-size: 14px;
  border: 1px solid transparent;
  border-bottom: none;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #40a9ff;
  background-color: #f0f0f0;
}

.tab-item.active {
  background-color: #fff;
  color: #1890ff;
  border-color: #e8e8e8;
  border-bottom: 1px solid #fff;
  margin-bottom: -1px;
  font-weight: 500;
}

.tab-add {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  margin-bottom: 4px;
  border-radius: 4px;
}

.tab-add:hover {
  background-color: #e6e6e6;
  color: #1890ff;
}
</style>
