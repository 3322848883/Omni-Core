<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <OmniCoreLogo :size="100" show-text />
        <p class="subtitle">流体智能 · 无界核心</p>
      </div>
      <div class="auth-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import OmniCoreLogo from '@components/common/OmniCoreLogo.vue';
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse at 20% 30%, rgba(0, 245, 255, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(184, 41, 221, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
}

.auth-container {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 245, 255, 0.05);
  overflow: hidden;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.auth-header {
  padding: 48px 40px 24px;
  text-align: center;
  background: linear-gradient(180deg, rgba(0, 245, 255, 0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .subtitle {
    font-size: 14px;
    color: rgba(224, 224, 255, 0.6);
    margin: 16px 0 0;
    letter-spacing: 0.1em;
  }
}

.auth-content {
  padding: 32px 40px 40px;
}
</style>
