<template>
  <div
    class="node-card"
    :class="{ 'node-offline': node.status !== 'online', 'node-premium': node.is_premium }"
  >
    <!-- 服务类型标签 -->
    <div
      class="service-type-badge"
      :style="{
        backgroundColor: node.service_type_color + '20',
        color: node.service_type_color,
        borderColor: node.service_type_color
      }"
    >
      <el-icon v-if="node.service_type === 'standard'"><Promotion /></el-icon>
      <el-icon v-else-if="node.service_type === 'dedicated_line'"><Medal /></el-icon>
      <el-icon v-else-if="node.service_type === 'exclusive'"><Lock /></el-icon>
      <el-icon v-else-if="node.service_type === 'static_residential'"><HomeFilled /></el-icon>
      <span>{{ node.service_type_label }}</span>
    </div>

    <div class="node-card__header">
      <div class="node-flag">{{ node.countryFlag }}</div>
      <div class="node-status">
        <span class="status-dot" :class="node.status"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <div class="node-card__content">
      <div class="node-name">{{ node.name }}</div>
      <div class="node-location">
        <el-icon><Location /></el-icon>
        {{ node.country }} {{ node.location }}
      </div>

      <!-- IP类型标签 -->
      <div v-if="node.ip_type" class="node-ip-type">
        <el-tag
          size="small"
          :style="getIpTypeStyle(node.ip_type)"
          class="ip-tag"
        >
          {{ getIpTypeLabel(node.ip_type) }}
        </el-tag>
      </div>

      <!-- 线路类型标签 -->
      <div v-if="node.line_type" class="node-line-type">
        <el-tag
          size="small"
          :style="getLineTypeStyle(node.line_type)"
          class="line-tag"
        >
          {{ getLineTypeLabel(node.line_type) }}
        </el-tag>
      </div>

      <!-- ISP信息 -->
      <div v-if="node.isp_name" class="node-isp">
        <el-icon><OfficeBuilding /></el-icon>
        <span class="isp-name">{{ node.isp_name }}</span>
        <el-tag
          v-if="node.ip_score"
          size="small"
          :type="getIpScoreType(node.ip_score)"
          class="ip-score-tag"
        >
          IP评分: {{ node.ip_score }}
        </el-tag>
      </div>

      <!-- 协议标签 -->
      <div class="node-protocols">
        <el-tag
          v-for="protocol in node.protocols"
          :key="protocol"
          size="small"
          effect="dark"
          class="protocol-tag"
        >
          {{ protocol.toUpperCase() }}
        </el-tag>
      </div>

      <!-- QoS 等级 -->
      <div class="node-qos">
        <span class="stat-label">QoS</span>
        <QoSIndicator :level="node.qos_level" />
      </div>

      <!-- 节点统计 -->
      <div class="node-stats">
        <div class="stat-row">
          <span class="stat-label">负载</span>
          <LoadIndicator :percentage="node.load" />
        </div>
        <div class="stat-row">
          <span class="stat-label">延迟</span>
          <LatencyIndicator :latency="node.latency" />
        </div>
      </div>
    </div>

    <div class="node-card__footer">
      <el-button
        type="primary"
        class="connect-btn"
        :disabled="node.status !== 'online'"
        @click="$emit('connect', node)"
      >
        <el-icon><Link /></el-icon>
        连接
      </el-button>
      <el-button
        class="test-btn"
        :loading="node.testing"
        @click="$emit('test', node)"
      >
        <el-icon><Odometer /></el-icon>
        测试
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Promotion,
  Medal,
  Lock,
  Location,
  Link,
  Odometer,
  OfficeBuilding,
  HomeFilled
} from '@element-plus/icons-vue';
import type { Node } from '@/types/node';
import QoSIndicator from './QoSIndicator.vue';
import LoadIndicator from './LoadIndicator.vue';
import LatencyIndicator from './LatencyIndicator.vue';

interface Props {
  node: Node;
}

const props = defineProps<Props>();

defineEmits<{
  connect: [node: Node];
  test: [node: Node];
}>();

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    busy: '繁忙',
    maintenance: '维护中'
  };
  return statusMap[props.node.status] || props.node.status;
});

const getIpTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    datacenter: '机房',
    residential_dynamic: '动态住宅',
    residential_static: '静态住宅',
    mobile: '移动'
  };
  return labels[type] || type;
};

const getIpTypeStyle = (type: string) => {
  const styles: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
    datacenter: {
      backgroundColor: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    },
    residential_dynamic: {
      backgroundColor: '#10B98120',
      borderColor: '#10B981',
      color: '#10B981'
    },
    residential_static: {
      backgroundColor: '#8B5CF620',
      borderColor: '#8B5CF6',
      color: '#8B5CF6'
    },
    mobile: {
      backgroundColor: '#F59E0B20',
      borderColor: '#F59E0B',
      color: '#F59E0B'
    }
  };
  return styles[type] || { backgroundColor: '#90939920', borderColor: '#909399', color: '#909399' };
};

const getLineTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    standard: '标准线路',
    cn2: 'CN2',
    iepl: 'IEPL',
    iplc: 'IPLC'
  };
  return labels[type] || type;
};

const getLineTypeStyle = (type: string) => {
  const styles: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
    standard: {
      backgroundColor: '#6B728020',
      borderColor: '#6B7280',
      color: '#6B7280'
    },
    cn2: {
      backgroundColor: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    },
    iepl: {
      backgroundColor: '#F59E0B20',
      borderColor: '#F59E0B',
      color: '#F59E0B'
    },
    iplc: {
      backgroundColor: '#EC489920',
      borderColor: '#EC4899',
      color: '#EC4899'
    }
  };
  return styles[type] || { backgroundColor: '#90939920', borderColor: '#909399', color: '#909399' };
};

const getIpScoreType = (score: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'danger';
  return 'info';
};
</script>

<style scoped lang="scss">
.node-card {
  position: relative;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-subtle, #e4e7ed);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;

  &:hover {
    border-color: var(--border-glow, #409eff);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }

  &.node-offline {
    opacity: 0.6;
  }

  &.node-premium {
    border-width: 2px;

    &::before {
      content: '';
      position: absolute;
      top: -2px;
      right: -2px;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 24px 24px 0;
      border-color: transparent var(--el-color-warning) transparent transparent;
      border-radius: 0 12px 0 0;
    }
  }

  .service-type-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid;

    .el-icon {
      font-size: 12px;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-right: 80px;
  }
}

.node-flag {
  font-size: 32px;
}

.node-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;

    &.online {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    &.offline {
      background: #ef4444;
    }

    &.busy {
      background: #f59e0b;
    }

    &.maintenance {
      background: #6b7280;
    }
  }

  .status-text {
    color: #606266;
  }
}

.node-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.node-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;

  .el-icon {
    font-size: 14px;
  }
}

.node-ip-type,
.node-line-type {
  margin-bottom: 8px;

  .ip-tag,
  .line-tag {
    font-weight: 500;
  }
}

.node-isp {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 6px;

  .el-icon {
    font-size: 14px;
    color: #909399;
  }

  .isp-name {
    font-size: 13px;
    color: #606266;
    flex: 1;
  }

  .ip-score-tag {
    font-size: 11px;
  }
}

.node-protocols {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;

  .protocol-tag {
    background: rgba(64, 158, 255, 0.1);
    border-color: rgba(64, 158, 255, 0.2);
    color: #409eff;
  }
}

.node-qos {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.node-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;

  .stat-label {
    font-size: 12px;
    color: #909399;
    min-width: 36px;
  }
}

.node-card__footer {
  display: flex;
  gap: 8px;

  .connect-btn {
    flex: 1;
    background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
    border: none;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    }

    &:disabled {
      background: #c0c4cc;
    }
  }

  .test-btn {
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    color: #606266;

    &:hover {
      background: #e4e7ed;
      border-color: #c0c4cc;
      color: #303133;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
