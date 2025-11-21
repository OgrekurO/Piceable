<template>
  <div class="language-switcher">
    <button 
      class="switcher-btn" 
      @click="showMenu = !showMenu"
      :title="'Translation / 翻译'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 8 6 6"></path>
        <path d="m4 14 6-6 2-3"></path>
        <path d="M2 5h12"></path>
        <path d="M7 2h1"></path>
        <path d="m22 22-5-10-5 10"></path>
        <path d="M14 18v4"></path>
        <path d="M18 18v4"></path>
      </svg>
    </button>

    <div v-if="showMenu" class="language-menu" @click.away="showMenu = false">
      <div class="menu-header">
        选择显示语言
      </div>
      
      <button 
        v-for="lang in LANGUAGES" 
        :key="lang.code"
        @click="handleLanguageSelect(lang.code)"
        class="language-item"
        :class="{ 'active': targetLanguage === lang.code }"
      >
        {{ lang.label }}
        <svg v-if="targetLanguage === lang.code" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMapStore } from '@/stores/map';

// 语言选项
const LANGUAGES = [
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'fr', label: 'Français' },
];

const showMenu = ref(false);
const mapStore = useMapStore();

// 计算当前目标语言
const targetLanguage = computed(() => mapStore.targetLanguage);

// 处理语言选择
const handleLanguageSelect = (langCode: string) => {
  mapStore.setTargetLanguage(langCode);
  showMenu.value = false;
};

// 导入computed
import { computed } from 'vue';
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.switcher-btn {
  background: white;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switcher-btn:hover {
  background: #f5f7fa;
  border-color: #c6c8cc;
}

.language-menu {
  position: absolute;
  right: 40px;
  top: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 160px;
  z-index: 1000;
  overflow: hidden;
}

.menu-header {
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.language-item {
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.language-item:hover {
  background: #f5f7fa;
}

.language-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.language-item svg {
  flex-shrink: 0;
}
</style>