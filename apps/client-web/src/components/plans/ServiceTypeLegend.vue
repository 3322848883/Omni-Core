<template>
  <div class="service-type-legend">
    <h4 class="legend-title">
      <el-icon><InfoFilled /></el-icon>
      服务类型说明
    </h4>
    <div class="legend-items">
      <div
        v-for="meta in serviceTypeList"
        :key="meta.type"
        class="legend-item"
        :class="{ active: selectedType === meta.type }"
        @click="$emit('select', meta.type)"
      >
        <div
          class="legend-icon"
          :style="{ backgroundColor: meta.bgColor, color: meta.color }"
        >
          <el-icon v-if="meta.icon === 'plane'"><Promotion /></el-icon>
          <el-icon v-else-if="meta.icon === 'crown'"><Medal /></el-icon>
          <el-icon v-else-if="meta.icon === 'shield'"><Lock /></el-icon>
          <el-icon v-else-if="meta.icon === 'home'"><HomeFilled /></el-icon>
          <el-icon v-else><CircleCheck /></el-icon>
        </div>
        <div class="legend-content">
          <div class="legend-name" :style="{ color: meta.color }">
            {{ meta.label }}
          </div>
          <div class="legend-desc">{{ meta.description }}</div>
        </div>
        <el-icon v-if="selectedType === meta.type" class="check-icon"><Check /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  InfoFilled,
  Promotion,
  Medal,
  Lock,
  CircleCheck,
  Check,
  HomeFilled
} from '@element-plus/icons-vue';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';

interface Props {
  selectedType?: ServiceType | null;
}

defineProps<Props>();

defineEmits<{
  select: [type: ServiceType];
}>();

const serviceTypeList = computed(() => {
  return Object.entries(ServiceTypeMeta).map(([type, meta]) => ({
    type: type as ServiceType,
    ...meta
  })).sort((a, b) => b.priority - a.priority);
});
</script>

<style scoped lang="scss">
.service-type-legend {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e4e7ed;

  .legend-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;

    .el-icon {
      color: #909399;
    }
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;

    &:hover {
      background-color: #f5f7fa;
    }

    &.active {
      background-color: #f0f9ff;
      border-color: #409eff;
    }

    .legend-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .el-icon {
        font-size: 20px;
      }
    }

    .legend-content {
      flex: 1;

      .legend-name {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .legend-desc {
        font-size: 13px;
        color: #909399;
        line-height: 1.4;
      }
    }

    .check-icon {
      color: #409eff;
      font-size: 18px;
    }
  }
}
</style>
