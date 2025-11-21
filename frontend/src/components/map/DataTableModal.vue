<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Database :size="20" class="text-palladio-blue" />
          数据管理
          <span class="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {{ data.length }} 条记录
          </span>
        </h2>
        <div class="flex items-center gap-3">
           <div class="relative">
             <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               v-model="localSearch"
               placeholder="搜索表格..."
               class="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-palladio-blue w-64 transition-all"
             />
           </div>
           <button 
             @click="$emit('close')"
             class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
           >
             <X :size="20" />
           </button>
        </div>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th v-for="col in columns" :key="col" class="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr 
              v-for="row in filteredData" 
              :key="row.id" 
              class="hover:bg-blue-50/50 transition-colors group"
            >
              <td v-for="col in columns" :key="col" class="px-6 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate">
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
        <div>
          显示 {{ filteredData.length }} 条结果
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-1 bg-white border border-gray-200 rounded hover:border-palladio-blue transition-colors">
            上一页
          </button>
          <button class="px-3 py-1 bg-white border border-gray-200 rounded hover:border-palladio-blue transition-colors">
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Database, Search } from 'lucide-vue-next';
import type { DataRecord } from '@/types/index';

const props = defineProps<{
  isOpen: boolean;
  data: DataRecord[];
  columns: string[];
}>();

defineEmits<{
  (e: 'close'): void
}>();

const localSearch = ref('');

const filteredData = computed(() => {
  if (!localSearch.value) return props.data;
  const term = localSearch.value.toLowerCase();
  return props.data.filter(row => 
    Object.values(row).some(val => String(val).toLowerCase().includes(term))
  );
});
</script>
