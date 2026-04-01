<template>
  <el-card class="node-card" :class="{ 'node-offline': node.status !== 'online' }">
    <div class="node-header">
      <div class="node-info">
        <img :src="node.countryFlag" :alt="node.country" class="node-flag" />
        <div class="node-details">
          <div class="node-name">{{ node.name }}</div>
          <div class="node-location">{{ node.location }}</div>
        </div>
      </div>
      <el-tag :type="getStatusType(node.status)" size="small">
        {{ getStatusText(node.status) }}
      </el-tag>
    </div>

    <div class="node-stats">
      <div class="stat-item">
        <span class="stat-label">延迟</span>
        <span :class="['stat-value', getLatencyClass(node.latency)]">
          {{ formatLatency(node.latency) }}
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">负载</span>
        <el-progress :percentage="node.load" :show-text="true" :stroke-width="6" />
      </div>
    </div>

    <div class="node-protocols">
      <el-tag
        v-for="protocol in node.protocols"
        :key="protocol"
        size="small"
        effect="plain"
        class="protocol-tag"
      >
        {{ protocol.toUpperCase() }}
      </el-tag>
    </div>

    <div class="node-actions">
      <el-button
        type="primary"
        size="small"
        :disabled="node.status !== 'online'"
        @click="emit('connect', node)"
      >
        <el-icon><Connection /></el-icon>
        连接
      </el-button>
      <el-button
        size="small"
        :loading="node.testing"
        @click="emit('test-latency', node)"
      >
        <el-icon><Timer /></el-icon>
        测速
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Connection, Timer } from '@element-plus/icons-vue';
import type { Node } from '@/types/node';

interface Props {
  node: Node;
}

defineProps<Props>();

const emit = defineEmits<{
  connect: [node: Node];
  'test-latency': [node: Node];
}>();

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    online: 'success',
    offline: 'danger',
    busy: 'warning',
    maintenance: 'info',
  };
  return types[status] || 'info';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    online: '在线',
    offline: '离线',
    busy: '繁忙',
    maintenance: '维护',
  };
  return texts[status] || status;
};

const getLatencyClass = (latency?: number) => {
  if (!latency || latency === -1) return '';
  if (latency < 100) return 'latency-good';
  if (latency < 300) return 'latency-normal';
  return 'latency-bad';
};

const formatLatency = (latency?: number) => {
  if (!latency || latency === -1) return '超时';
  return `${latency}ms`;
};
</script>

<style scoped lang="scss">
.node-card {
  margin-bottom: 16px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.node-offline {
    opacity: 0.7;
  }

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .node-info {
      display: flex;
      align-items: center;

      .node-flag {
        width: 32px;
        height: 24px;
        border-radius: 4px;
        margin-right: 12px;
        object-fit: cover;
      }

      .node-details {
        .node-name {
          font-weight: 600;
          color: #303133;
          font-size: 16px;
        }

        .node-location {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .node-stats {
    margin-bottom: 12px;

    .stat-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .stat-label {
        width: 40px;
        font-size: 12px;
        color: #909399;
      }

      .stat-value {
        font-size: 14px;
        font-weight: 500;

        &.latency-good {
          color: #67c23a;
        }

        &.latency-normal {
          color: #e6a23c;
        }

        &.latency-bad {
          color: #f56c6c;
        }
      }

      .el-progress {
        flex: 1;
        margin-left: 8px;
      }
    }
  }

  .node-protocols {
    margin-bottom: 12px;

    .protocol-tag {
      margin-right: 4px;
      margin-bottom: 4px;
    }
  }

  .node-actions {
    display: flex;
    gap: 8px;

    .el-button {
      flex: 1;
    }
  }
}
</style>
