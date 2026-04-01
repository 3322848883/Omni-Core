<template>
  <el-card class="service-type-card" :class="{ 'is-premium': isPremium }" shadow="hover">
    <div class="card-header">
      <div class="type-icon" :style="{ backgroundColor: meta.bgColor, color: meta.color }">
        <el-icon :size="28">
          <component :is="getIconComponent(meta.icon)" />
        </el-icon>
      </div>
      <div class="type-info">
        <h3 class="type-name">{{ meta.label }}</h3>
        <el-tag :color="meta.color" effect="light" size="small">
          {{ type }}
        </el-tag>
      </div>
      <el-switch
        v-model="localEnabled"
        @change="handleToggle"
        active-text="启用"
        inactive-text="禁用"
      />
    </div>

    <div class="type-description">{{ meta.description }}</div>

    <el-divider />

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value" :style="{ color: meta.color }">{{ stats.nodeCount }}</div>
        <div class="stat-label">节点数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" :style="{ color: meta.color }">{{ stats.userCount }}</div>
        <div class="stat-label">用户数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" :style="{ color: meta.color }">{{ stats.activeUsers }}</div>
        <div class="stat-label">在线用户</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" :style="{ color: meta.color }">{{ formatTraffic(stats.trafficUsed) }}</div>
        <div class="stat-label">今日流量</div>
      </div>
    </div>

    <el-divider />

    <div class="card-footer">
      <div class="priority-info">
        <span class="label">优先级:</span>
        <el-rate :model-value="meta.priority" disabled :max="3" />
      </div>
      <div class="actions">
        <el-button type="primary" link @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button type="primary" link @click="handleViewNodes">
          <el-icon><View /></el-icon>
          查看节点
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';
import { ServiceType, ServiceTypeMeta } from '@shared/constants/service-type.mjs';
import { getIconComponent } from '@utils/icon-map';

interface ServiceTypeStats {
  nodeCount: number;
  userCount: number;
  activeUsers: number;
  trafficUsed: number;
}

const props = defineProps<{
  type: ServiceType;
  enabled: boolean;
  stats: ServiceTypeStats;
}>();

const emit = defineEmits<{
  'update:enabled': [value: boolean];
  edit: [type: ServiceType];
  'view-nodes': [type: ServiceType];
}>();

const localEnabled = ref(props.enabled);

const meta = computed(() => ServiceTypeMeta[props.type]);

const isPremium = computed(() => {
  return props.type === ServiceType.DEDICATED_LINE || props.type === ServiceType.EXCLUSIVE || props.type === ServiceType.STATIC_RESIDENTIAL;
});

const formatTraffic = (bytes: number): string => {
  if (bytes === 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb < 1) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (gb < 1024) return `${gb.toFixed(2)} GB`;
  return `${(gb / 1024).toFixed(2)} TB`;
};

const handleToggle = (val: boolean) => {
  emit('update:enabled', val);
};

const handleEdit = () => {
  emit('edit', props.type);
};

const handleViewNodes = () => {
  emit('view-nodes', props.type);
};
</script>

<style scoped lang="scss">
.service-type-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  &.is-premium {
    border: 1px solid #f59e0b;

    :deep(.el-card__header) {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .type-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .type-info {
      flex: 1;

      .type-name {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .type-description {
    color: #606266;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .stat-item {
      text-align: center;
      padding: 12px;
      background-color: #f5f7fa;
      border-radius: 8px;

      .stat-value {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .card-footer {
    .priority-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .label {
        font-size: 13px;
        color: #606266;
      }
    }

    .actions {
      display: flex;
      gap: 8px;

      .el-button {
        padding: 0;
      }
    }
  }
}
</style>
