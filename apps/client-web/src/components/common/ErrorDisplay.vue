<template>
  <div class="error-display" :class="{ inline, center }">
    <el-empty
      :description="message"
      :image="image"
      :image-size="imageSize"
    >
      <template #image>
        <slot name="image">
          <el-icon :size="iconSize" class="error-icon">
            <CircleCloseFilled />
          </el-icon>
        </slot>
      </template>
      <template #description>
        <slot name="description">
          <div class="error-message">{{ message }}</div>
          <div v-if="description" class="error-description">{{ description }}</div>
        </slot>
      </template>
      <template #default>
        <slot>
          <el-button
            v-if="showRetry"
            type="primary"
            :loading="retrying"
            @click="handleRetry"
          >
            <el-icon><Refresh /></el-icon>
            {{ retryText }}
          </el-button>
        </slot>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CircleCloseFilled, Refresh } from '@element-plus/icons-vue';

interface Props {
  message?: string;
  description?: string;
  image?: string;
  imageSize?: number;
  iconSize?: number;
  showRetry?: boolean;
  retryText?: string;
  inline?: boolean;
  center?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: '出错了',
  description: '',
  image: '',
  imageSize: 120,
  iconSize: 64,
  showRetry: true,
  retryText: '重试',
  inline: false,
  center: true,
});

const emit = defineEmits<{
  retry: [];
}>();

const retrying = ref(false);

const handleRetry = async () => {
  retrying.value = true;
  try {
    emit('retry');
  } finally {
    retrying.value = false;
  }
};
</script>

<style scoped lang="scss">
.error-display {
  padding: 20px;

  &.center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  &.inline {
    padding: 10px;
    min-height: auto;
  }

  .error-icon {
    color: #f56c6c;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 16px;
    color: #303133;
    margin-bottom: 8px;
  }

  .error-description {
    font-size: 14px;
    color: #909399;
  }
}
</style>
