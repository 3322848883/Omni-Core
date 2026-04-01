<template>
  <div class="loading-container" :class="{ fullscreen, overlay }">
    <el-spin
      :size="size"
      :text="text"
      v-bind="$attrs"
    >
      <template v-if="$slots.default">
        <slot />
      </template>
    </el-spin>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'large' | 'default' | 'small';
  text?: string;
  fullscreen?: boolean;
  overlay?: boolean;
}

withDefaults(defineProps<Props>(), {
  size: 'default',
  text: '加载中...',
  fullscreen: false,
  overlay: false,
});
</script>

<style scoped lang="scss">
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
    background-color: rgba(255, 255, 255, 0.9);
  }

  &.overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background-color: rgba(255, 255, 255, 0.8);
  }
}
</style>
