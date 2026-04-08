<template>
  <el-dropdown @command="handleLanguageChange" trigger="click">
    <span class="language-switcher">
      <el-icon><Location /></el-icon>
      <span class="current-language">{{ currentLanguageLabel }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu class="language-dropdown">
        <el-dropdown-item command="zh-CN" :class="{ active: locale === 'zh-CN' }">
          简体中文
        </el-dropdown-item>
        <el-dropdown-item command="en-US" :class="{ active: locale === 'en-US' }">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Location } from '@element-plus/icons-vue';

const { locale } = useI18n();

const currentLanguageLabel = computed(() => {
  return locale.value === 'zh-CN' ? '简体中文' : 'English';
});

const handleLanguageChange = (lang: string) => {
  locale.value = lang;
  localStorage.setItem('locale', lang);
  location.reload();
};
</script>

<style scoped lang="scss">
.language-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--cyber-text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(14, 165, 233, 0.1);
  }

  .current-language {
    font-size: 14px;
  }
}

.language-dropdown {
  .el-dropdown-item {
    &.active {
      color: var(--cyber-accent-blue);
      font-weight: 600;
    }
  }
}
</style>
