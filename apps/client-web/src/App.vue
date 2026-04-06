<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <!-- Landing page doesn't use animated background -->
      <template v-if="isLandingPage">
        <component :is="Component" :key="route.path" />
      </template>
      <!-- Other pages use animated background -->
      <AnimatedBackground v-else :key="route.path">
        <component :is="Component" />
      </AnimatedBackground>
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AnimatedBackground from '@/components/common/AnimatedBackground.vue';

const route = useRoute();

// Check if current route is landing page
const isLandingPage = computed(() => {
  return route.path === '/' || route.name === 'landing';
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
