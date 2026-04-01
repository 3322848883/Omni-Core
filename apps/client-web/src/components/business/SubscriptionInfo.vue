<template>
  <div class="subscription-info" v-if="subscription">
    <div class="info-header">
      <div class="plan-info">
        <h3 class="plan-name">{{ subscription.planName }}</h3>
        <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
      </div>
      <div class="days-remaining" v-if="subscription.daysRemaining > 0">
        <span class="days">{{ subscription.daysRemaining }}</span>
        <span class="label">天剩余</span>
      </div>
    </div>

    <el-divider />

    <div class="traffic-section">
      <div class="traffic-header">
        <span class="section-title">流量使用</span>
        <span class="traffic-usage">
          {{ formatTraffic(subscription.trafficUsed) }} / {{ formatTraffic(subscription.trafficLimit) }}
        </span>
      </div>
      <el-progress
        :percentage="usagePercent"
        :status="isTrafficWarning ? 'exception' : ''"
        :stroke-width="12"
        class="traffic-progress"
      />
      <div class="traffic-stats">
        <div class="stat">
          <div class="stat-label">已用流量</div>
          <div class="stat-value">{{ formatTraffic(subscription.trafficUsed) }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">剩余流量</div>
          <div class="stat-value">{{ formatTraffic(subscription.trafficRemaining) }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">总流量</div>
          <div class="stat-value">{{ formatTraffic(subscription.trafficLimit) }}</div>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="subscription-details">
      <div class="detail-item">
        <span class="detail-label">有效期至</span>
        <span class="detail-value">{{ subscription.endDate }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">开始日期</span>
        <span class="detail-value">{{ subscription.startDate }}</span>
      </div>
    </div>

    <div class="subscription-actions">
      <slot name="actions">
        <el-button type="primary" @click="emit('renew')">续费订阅</el-button>
        <el-button @click="emit('view-details')">查看详情</el-button>
      </slot>
    </div>
  </div>

  <el-empty v-else description="暂无订阅">
    <el-button type="primary" @click="emit('subscribe')">立即订阅</el-button>
  </el-empty>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatTraffic } from '@/utils/format';
import type { Subscription } from '@/types/subscription';

interface Props {
  subscription: Subscription | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  renew: [];
  'view-details': [];
  subscribe: [];
}>();

const usagePercent = computed(() => {
  if (!props.subscription) return 0;
  return Math.round(
    (props.subscription.trafficUsed / props.subscription.trafficLimit) * 100
  );
});

const isTrafficWarning = computed(() => usagePercent.value >= 80);

const isExpiringSoon = computed(() => {
  if (!props.subscription) return false;
  return props.subscription.daysRemaining <= 7;
});

const statusType = computed(() => {
  if (!props.subscription) return 'info';
  if (props.subscription.status === 'expired') return 'danger';
  if (isExpiringSoon.value) return 'warning';
  return 'success';
});

const statusText = computed(() => {
  if (!props.subscription) return '未订阅';
  if (props.subscription.status === 'expired') return '已过期';
  if (isExpiringSoon.value) return '即将过期';
  return '正常';
});
</script>

<style scoped lang="scss">
.subscription-info {
  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .plan-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .plan-name {
        margin: 0;
        font-size: 20px;
        color: #303133;
      }
    }

    .days-remaining {
      text-align: center;

      .days {
        display: block;
        font-size: 32px;
        font-weight: 700;
        color: #409eff;
        line-height: 1;
      }

      .label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .traffic-section {
    .traffic-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .section-title {
        font-weight: 600;
        color: #303133;
      }

      .traffic-usage {
        font-size: 14px;
        color: #606266;
      }
    }

    .traffic-progress {
      margin-bottom: 16px;
    }

    .traffic-stats {
      display: flex;
      justify-content: space-around;
      text-align: center;

      .stat {
        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .subscription-details {
    margin-bottom: 16px;

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;

      .detail-label {
        color: #909399;
      }

      .detail-value {
        color: #606266;
      }
    }
  }

  .subscription-actions {
    display: flex;
    gap: 12px;

    .el-button {
      flex: 1;
    }
  }
}
</style>
