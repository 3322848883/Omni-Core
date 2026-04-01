<template>
  <div class="qos-indicator" :title="`QoS 等级: ${level}/5`">
    <el-icon
      v-for="star in 5"
      :key="star"
      class="star-icon"
      :class="{ filled: star <= level, empty: star > level }"
    >
      <StarFilled v-if="star <= level" />
      <Star v-else />
    </el-icon>
    <span v-if="showLabel" class="qos-label">{{ level }}级</span>
  </div>
</template>

<script setup lang="ts">
import { Star, StarFilled } from '@element-plus/icons-vue';

interface Props {
  level: number;
  showLabel?: boolean;
}

withDefaults(defineProps<Props>(), {
  level: 1,
  showLabel: false
});
</script>

<style scoped lang="scss">
.qos-indicator {
  display: flex;
  align-items: center;
  gap: 2px;

  .star-icon {
    font-size: 14px;
    transition: all 0.3s ease;

    &.filled {
      color: #f7ba2a;
    }

    &.empty {
      color: #dcdfe6;
    }
  }

  .qos-label {
    margin-left: 6px;
    font-size: 12px;
    color: #909399;
    font-weight: 500;
  }
}
</style>
