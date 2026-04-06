<template>
  <div class="landing-wrapper">
    <iframe ref="iframeRef" src="/index.html" class="landing-iframe" frameborder="0" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const iframeRef = ref<HTMLIFrameElement>();

onMounted(() => {
  // Listen for messages from iframe
  const handleMessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    if (type === 'LOGIN_SUCCESS') {
      // Save tokens to localStorage
      localStorage.setItem('token', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(data.user));

      // Sync to userStore
      userStore.setToken(data.tokens.accessToken);
      userStore.setUserInfo(data.user);

      // Sync to authStore (required for API requests)
      // Note: Pinia store state refs are automatically unwrapped in components
      // But we need to ensure localStorage is set before the page reloads
      // The authStore will read from localStorage on next init

      ElMessage.success('登录成功！');

      // Navigate to app using window.location for full page reload
      // This ensures the router guard sees the updated auth state
      window.location.href = '/app';
    }
  };

  window.addEventListener('message', handleMessage);

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });
});
</script>

<style scoped>
.landing-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.landing-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
