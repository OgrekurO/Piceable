<template>
  <button 
    @click="$emit('toggle')"
    class="module-header"
    :class="{ 'is-open': isOpen }"
  >
    <div class="header-content">
      <span class="icon-wrapper">
        <component :is="icon" :size="18" />
      </span>
      <span class="header-title">{{ title }}</span>
    </div>
    <component 
      :is="isOpen ? ChevronDown : ChevronRight" 
      :size="16" 
      class="chevron-icon"
    />
  </button>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next';

defineProps<{ 
  title: string; 
  icon: any; 
  isOpen: boolean; 
}>();

defineEmits<{
  (e: 'toggle'): void
}>();
</script>

<style scoped>
.module-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: white;
  border: none; /* Remove default button border */
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  cursor: pointer;
  outline: none;
}

.module-header:hover {
  background-color: #f9fafb;
}

.module-header.is-open {
  background-color: #f8fafc; /* Slightly darker/blue-tinted bg when open */
  border-bottom-color: #e5e7eb;
}

.header-content {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #374151; /* text-gray-700 */
}

.icon-wrapper {
  margin-right: 0.75rem;
  color: var(--palladio-blue, #0077b6);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.module-header:hover .icon-wrapper {
  transform: scale(1.1);
}

.header-title {
  font-size: 0.875rem;
}

.chevron-icon {
  color: #9ca3af; /* text-gray-400 */
  transition: transform 0.2s ease, color 0.2s;
}

.module-header:hover .chevron-icon {
  color: #6b7280; /* text-gray-500 */
}

.module-header.is-open .chevron-icon {
  color: var(--palladio-blue, #0077b6);
}
</style>