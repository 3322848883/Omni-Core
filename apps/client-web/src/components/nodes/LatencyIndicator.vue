<template>
  <div class="latency-indicator" :class="latencyClass">
    <el-icon class="latency-icon">
      <CircleCheck v-if="latencyClass === 'excellent'" />
      <SuccessFilled v-else-if="latencyClass === 'good'" />
      <WarningFilled v-else-if="latencyClass === 'fair'" />
      <CircleCloseFilled v-else />
    </el-icon>
    <span class="latency-value">{{ formattedLatency }}</span>
    <span v-if="showLabel" class="latency-label">{{ latencyLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CircleCheck,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue';

interface Props {
  latency?: number;
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  latency: undefined,
  showLabel: false
});

const latencyClass = computed(() => {
  if (!props.latency) return 'unknown';
  if (props.latency < 100) return 'excellent';
  if (props.latency < 200) return 'good';
  if (props.latency < 300) return 'fair';
  return 'poor';
});

const formattedLatency = computed(() => {
  if (!props.latency) return '-';
  return `${props.latency}ms`;
});

const latencyLabel = computed(() => {
  switch (latencyClass.value) {
    case 'excellent': return '极佳';
    case 'good': return '良好';
    case 'fair': return '一般';
    case 'poor': return '较差';
    default: return '未知';
  }
});
</script>

<style scoped lang="scss">
.latency-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono, monospace);

  .latency-icon {
    font-size: 14px;
  }

  .latency-value {
    font-size: 14px;
    font-weight: 600;
  }

  .latency-label {
    font-size: 12px;
    margin-left: 4px;
  }

  &.excellent {
    color: #10b981;
  }

  &.good {
    color: #3b82f6;
  }

  &.fair {
    color: #f59e0b;
  }

  &.poor {
    color: #ef4444;
  }

  &.unknown {
    color: #9ca3af;
  }
}
</style>
