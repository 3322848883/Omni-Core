<template>
  <button class="language-switcher" @click="toggleDropdown">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
    <span>{{ currentLanguageLabel }}</span>
    <div v-if="dropdownOpen" class="dropdown-menu">
      <button 
        v-for="lang in languages" 
        :key="lang.code"
        class="dropdown-item"
        :class="{ active: locale === lang.code }"
        @click="handleLanguageChange(lang.code)"
      >
        {{ lang.label }}
      </button>
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const dropdownOpen = ref(false);

const languages = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' }
];

const currentLanguageLabel = computed(() => {
  return locale.value === 'zh-CN' ? '简体中文' : 'English';
});

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const handleLanguageChange = (lang: string) => {
  locale.value = lang;
  localStorage.setItem('locale', lang);
  location.reload();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.language-switcher')) {
    dropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.language-switcher {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #9CA3AF;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.1);
    border-color: rgba(0, 255, 255, 0.3);
    color: #00FFFF;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  span {
    font-size: 14px;
    font-weight: 500;
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  z-index: 1000;
}

.dropdown-item {
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #9CA3AF;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.1);
    color: #00FFFF;
  }

  &.active {
    color: #00FFFF;
    font-weight: 600;
    background: rgba(0, 255, 255, 0.08);
  }
}
</style>
