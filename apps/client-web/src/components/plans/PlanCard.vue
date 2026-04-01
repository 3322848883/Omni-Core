<template>
  <el-card
    class="plan-card"
    :class="{ popular: plan.is_recommended || plan.recommended, current: isCurrent }"
    shadow="hover"
  >
    <div v-if="plan.is_recommended || plan.recommended" class="popular-badge">最受欢迎</div>
    <div v-if="isCurrent" class="current-badge">当前套餐</div>

    <div class="plan-header">
      <h3 class="plan-name">{{ plan.name }}</h3>
      <p class="plan-description">{{ plan.description }}</p>
    </div>

    <!-- 套餐组标签 -->
    <div v-if="plan.group_name" class="plan-group-tag">
      <el-tag size="small" effect="plain" type="info">
        {{ plan.group_name }}
      </el-tag>
    </div>

    <!-- IP类型标签 -->
    <div class="ip-types">
      <el-tag
        v-for="type in plan.ip_types"
        :key="type"
        class="ip-type-tag"
        size="small"
        :style="getIpTypeStyle(type)"
      >
        {{ getIpTypeLabel(type) }}
      </el-tag>
    </div>

    <!-- 线路类型标签 -->
    <div class="line-types">
      <el-tag
        v-for="type in plan.line_types"
        :key="type"
        class="line-type-tag"
        size="small"
        :style="getLineTypeStyle(type)"
      >
        {{ getLineTypeLabel(type) }}
      </el-tag>
    </div>

    <div class="plan-price">
      <span class="currency">¥</span>
      <span class="amount">{{ plan.price }}</span>
      <span class="period">/ {{ plan.period === 'month' ? '月' : plan.period === 'quarter' ? '季' : '年' }}</span>
    </div>

    <!-- 关键指标 -->
    <div class="plan-metrics">
      <div class="metric-item">
        <el-icon><Download /></el-icon>
        <span class="metric-value">{{ formatBytes(plan.traffic_limit) }}</span>
        <span class="metric-label">流量</span>
      </div>
      <div class="metric-item">
        <el-icon><Cpu /></el-icon>
        <span class="metric-value">{{ plan.bandwidth }}Mbps</span>
        <span class="metric-label">保证带宽</span>
      </div>
      <div class="metric-item">
        <el-icon><Connection /></el-icon>
        <span class="metric-value">{{ plan.device_limit }}</span>
        <span class="metric-label">最大连接</span>
      </div>
      <div v-if="accessibleNodes > 0" class="metric-item">
        <el-icon><OfficeBuilding /></el-icon>
        <span class="metric-value">{{ accessibleNodes }}</span>
        <span class="metric-label">可用节点</span>
      </div>
    </div>

    <!-- 适用场景 -->
    <div v-if="plan.scenarios && plan.scenarios.length > 0" class="plan-scenarios">
      <div class="scenarios-label">适用场景</div>
      <div class="scenarios-tags">
        <el-tag
          v-for="scenario in plan.scenarios.slice(0, 3)"
          :key="scenario"
          size="small"
          type="info"
          effect="plain"
        >
          {{ scenario }}
        </el-tag>
      </div>
    </div>

    <div class="plan-features">
      <div
        v-for="(feature, index) in plan.features.slice(0, 5)"
        :key="index"
        class="feature-item"
      >
        <el-icon color="#67c23a"><Check /></el-icon>
        <span>{{ feature }}</span>
      </div>
    </div>

    <div class="plan-actions">
      <el-button
        type="primary"
        size="large"
        class="subscribe-btn"
        :disabled="isCurrent"
        @click="$emit('subscribe', plan)"
      >
        {{ isCurrent ? '当前套餐' : '立即订阅' }}
      </el-button>
      <el-button
        size="large"
        class="detail-btn"
        @click="$emit('view-detail', plan)"
      >
        查看详情
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import {
  Check,
  Download,
  Cpu,
  Connection,
  OfficeBuilding
} from '@element-plus/icons-vue';
import type { Plan } from '@/types/subscription';

interface Props {
  plan: Plan;
  isCurrent?: boolean;
  accessibleNodes?: number;
}

withDefaults(defineProps<Props>(), {
  isCurrent: false,
  accessibleNodes: 0
});

defineEmits<{
  subscribe: [plan: Plan];
  'view-detail': [plan: Plan];
}>();

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
    standard: '标准',
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
</script>

<style scoped lang="scss">
.plan-card {
  position: relative;
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &.popular {
    border: 2px solid #409eff;
  }

  &.current {
    opacity: 0.9;
    background-color: #f5f7fa;
  }

  .popular-badge {
    position: absolute;
    top: 0;
    right: 20px;
    background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
    color: #fff;
    padding: 4px 12px;
    font-size: 12px;
    border-radius: 0 0 8px 8px;
    font-weight: 500;
  }

  .current-badge {
    position: absolute;
    top: 0;
    right: 20px;
    background: linear-gradient(135deg, #67c23a 0%, #52c41a 100%);
    color: #fff;
    padding: 4px 12px;
    font-size: 12px;
    border-radius: 0 0 8px 8px;
    font-weight: 500;
  }

  .plan-header {
    text-align: center;
    margin-bottom: 12px;

    .plan-name {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .plan-description {
      color: #909399;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  .plan-group-tag {
    text-align: center;
    margin-bottom: 12px;
  }

  .ip-types,
  .line-types {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-bottom: 8px;

    .ip-type-tag,
    .line-type-tag {
      font-weight: 500;
    }
  }

  .plan-price {
    text-align: center;
    margin-bottom: 16px;

    .currency {
      font-size: 20px;
      color: #f56c6c;
      font-weight: 500;
    }

    .amount {
      font-size: 42px;
      font-weight: 700;
      color: #f56c6c;
      margin: 0 4px;
    }

    .period {
      font-size: 14px;
      color: #909399;
    }
  }

  .plan-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 8px;

    .metric-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .el-icon {
        font-size: 18px;
        color: #409eff;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .metric-label {
        font-size: 11px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }

  .plan-scenarios {
    margin-bottom: 12px;
    padding: 8px 0;
    border-top: 1px solid #f0f0f0;

    .scenarios-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }

    .scenarios-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  .plan-features {
    margin-bottom: 16px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      color: #606266;
      font-size: 13px;

      .el-icon {
        flex-shrink: 0;
      }
    }
  }

  .plan-actions {
    display: flex;
    gap: 8px;

    .subscribe-btn {
      flex: 1;
      background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
      border: none;
      font-weight: 500;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
      }

      &:disabled {
        background: #c0c4cc;
      }
    }

    .detail-btn {
      flex: 1;
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
}
</style>
