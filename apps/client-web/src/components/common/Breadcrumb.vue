<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
      <span
        v-if="index === breadcrumbs.length - 1"
        class="breadcrumb-current"
      >
        {{ item.title }}
      </span>
      <router-link v-else :to="item.path" class="breadcrumb-link">
        {{ item.title }}
      </router-link>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface BreadcrumbItem {
  title: string;
  path: string;
}

const route = useRoute();

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const matched = route.matched.filter((item) => item.meta?.title);
  const items: BreadcrumbItem[] = [];

  matched.forEach((item) => {
    if (item.meta?.title) {
      items.push({
        title: item.meta.title as string,
        path: item.path,
      });
    }
  });

  return items;
});
</script>

<style scoped lang="scss">
.breadcrumb-link {
  color: #606266;
  text-decoration: none;

  &:hover {
    color: #409eff;
  }
}

.breadcrumb-current {
  color: #303133;
  font-weight: 500;
}
</style>
