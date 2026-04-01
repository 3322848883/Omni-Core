<template>
  <div class="load-indicator">
    <div class="load-bar-container">
      <div
        class="load-bar"
        :style="{
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: getLoadColor(percentage)
        }"
      />
    </div>
    <span class="load-text" :style="{ color: getLoadColor(percentage) }">
      {{ percentage }}%
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  percentage: number;
}

withDefaults(defineProps<Props>(), {
  percentage: 0
});

const getLoadColor = (load: number): string => {
  if (load < 30) return '#10b981'; // 绿色 - 空闲
  if (load < 60) return '#3b82f6'; // 蓝色 - 正常
  if (load < 80) return '#f59e0b'; // 橙色 - 繁忙
  return '#ef4444'; // 红色 - 拥挤
};
</script>

<style scoped lang="scss">
.load-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .load-bar-container {
    flex: 1;
    height: 6px;
    background-color: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }

  .load-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease, background-color 0.3s ease;
  }

  .load-text {
    font-size: 12px;
    font-weight: 600;
    min-width: 36px;
    text-align: right;
    font-family: var(--font-mono, monospace);
  }
}
</style>
