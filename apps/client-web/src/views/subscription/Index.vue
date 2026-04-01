<template>
  <div class="subscription-page">
    <div class="page-header">
      <h1 class="page-title">我的订阅</h1>
      <p class="page-subtitle">管理您的订阅信息和服务权限</p>
    </div>

    <!-- Current Subscription Status -->
    <el-card class="status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>订阅状态</span>
          <el-tag :type="subscriptionStatusType">{{ subscriptionStatusText }}</el-tag>
        </div>
      </template>

      <div class="status-content">
        <div class="status-item">
          <div class="item-label">套餐类型</div>
          <div class="item-value">{{ subscriptionInfo?.planName || '暂无订阅' }}</div>
        </div>
        <div class="status-item">
          <div class="item-label">到期时间</div>
          <div class="item-value">{{ formatDate(subscriptionInfo?.expireDate || null) }}</div>
        </div>
        <div class="status-item">
          <div class="item-label">剩余天数</div>
          <div class="item-value" :class="{ 'text-warning': daysRemaining <= 7 }">
            {{ daysRemaining > 0 ? `${daysRemaining} 天` : '已过期' }}
          </div>
        </div>
      </div>

      <!-- 套餐组信息 -->
      <div v-if="subscriptionInfo?.planGroup" class="plan-group-section">
        <div class="section-label">套餐组</div>
        <div class="plan-group-tag" :style="{ borderColor: subscriptionInfo.planGroup.color }">
          <el-icon :size="18" :color="subscriptionInfo.planGroup.color">
            <component :is="getGroupIcon(subscriptionInfo.planGroup.icon)" />
          </el-icon>
          <span :style="{ color: subscriptionInfo.planGroup.color }">
            {{ subscriptionInfo.planGroup.name }}
          </span>
        </div>
      </div>

      <!-- IP类型和线路类型 -->
      <div v-if="subscriptionInfo?.ipTypes?.length || subscriptionInfo?.lineTypes?.length" class="access-types-section">
        <div class="access-type-group" v-if="subscriptionInfo?.ipTypes?.length">
          <div class="section-label">可访问IP类型</div>
          <div class="access-tags">
            <el-tag
              v-for="type in subscriptionInfo.ipTypes"
              :key="type"
              size="small"
              :style="getIpTypeStyle(type)"
            >
              {{ getIpTypeLabel(type) }}
            </el-tag>
          </div>
        </div>
        <div class="access-type-group" v-if="subscriptionInfo?.lineTypes?.length">
          <div class="section-label">可访问线路类型</div>
          <div class="access-tags">
            <el-tag
              v-for="type in subscriptionInfo.lineTypes"
              :key="type"
              size="small"
              :style="getLineTypeStyle(type)"
            >
              {{ getLineTypeLabel(type) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 服务类型标签 -->
      <div v-if="subscriptionInfo?.effectiveServiceTypes?.length" class="service-types-section">
        <div class="section-label">当前服务类型</div>
        <div class="service-type-tags">
          <el-tag
            v-for="type in subscriptionInfo.effectiveServiceTypes"
            :key="type"
            class="service-type-tag"
            :style="{
              backgroundColor: getServiceTypeMeta(type).bgColor,
              borderColor: getServiceTypeMeta(type).color,
              color: getServiceTypeMeta(type).color
            }"
          >
            <el-icon v-if="getServiceTypeMeta(type).icon === 'plane'"><Promotion /></el-icon>
            <el-icon v-else-if="getServiceTypeMeta(type).icon === 'crown'"><Medal /></el-icon>
            <el-icon v-else-if="getServiceTypeMeta(type).icon === 'shield'"><Lock /></el-icon>
            {{ getServiceTypeMeta(type).label }}
          </el-tag>
        </div>
      </div>

      <!-- 带宽和优先级 -->
      <div v-if="subscriptionInfo" class="bandwidth-section">
        <div class="bandwidth-item">
          <el-icon><Cpu /></el-icon>
          <span class="bandwidth-label">保证带宽</span>
          <span class="bandwidth-value">{{ subscriptionInfo.guaranteedBandwidth || 20 }} Mbps</span>
        </div>
        <div class="bandwidth-item">
          <el-icon><TopRight /></el-icon>
          <span class="bandwidth-label">优先级等级</span>
          <span class="bandwidth-value">{{ subscriptionInfo.priorityLevel || 1 }}</span>
        </div>
        <div class="bandwidth-item" v-if="subscriptionInfo?.deviceLimit">
          <el-icon><Monitor /></el-icon>
          <span class="bandwidth-label">设备限制</span>
          <span class="bandwidth-value">{{ subscriptionInfo.deviceLimit }} 台</span>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>流量使用</span>
          <span>{{ formatBytes(trafficUsed) }} / {{ formatBytes(trafficLimit) }}</span>
        </div>
        <el-progress
          :percentage="trafficPercentage"
          :status="trafficProgressStatus"
          :stroke-width="12"
        />
        <div class="progress-footer">
          <span>剩余流量: {{ formatBytes(trafficRemaining) }}</span>
        </div>
      </div>

      <div class="action-section">
        <el-button type="primary" @click="goToPlans">
          <el-icon><Goods /></el-icon>
          升级套餐
        </el-button>
        <el-button @click="showRenewDialog" v-if="!isExpired">
          <el-icon><Refresh /></el-icon>
          续费订阅
        </el-button>
      </div>
    </el-card>

    <!-- 可访问节点统计 -->
    <el-card v-if="subscriptionInfo?.accessibleNodes" class="nodes-stats-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><OfficeBuilding /></el-icon>
            可访问节点
          </span>
          <el-tag type="info">共 {{ subscriptionInfo.accessibleNodes.total }} 个</el-tag>
        </div>
      </template>

      <!-- 按服务类型统计 -->
      <div v-if="subscriptionInfo.accessibleNodes.byType" class="nodes-stats-section">
        <div class="section-title">按服务类型</div>
        <div class="nodes-stats-grid">
          <div
            v-for="(count, type) in subscriptionInfo.accessibleNodes.byType"
            :key="type"
            class="nodes-stat-item"
          >
            <div class="stat-icon"
              :style="{
                backgroundColor: getServiceTypeMeta(type as ServiceType).bgColor,
                color: getServiceTypeMeta(type as ServiceType).color
              }"
            >
              <el-icon v-if="getServiceTypeMeta(type as ServiceType).icon === 'plane'"><Promotion /></el-icon>
              <el-icon v-else-if="getServiceTypeMeta(type as ServiceType).icon === 'crown'"><Medal /></el-icon>
              <el-icon v-else-if="getServiceTypeMeta(type as ServiceType).icon === 'shield'"><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-count">{{ count }}</div>
              <div class="stat-type">{{ getServiceTypeMeta(type as ServiceType).label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 按IP类型统计 -->
      <div v-if="subscriptionInfo.accessibleNodes.byIpType" class="nodes-stats-section">
        <div class="section-title">按IP类型</div>
        <div class="nodes-stats-grid">
          <div
            v-for="(count, type) in subscriptionInfo.accessibleNodes.byIpType"
            :key="type"
            class="nodes-stat-item"
          >
            <div class="stat-icon" :style="getIpTypeStyle(type as IpType)">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-count">{{ count }}</div>
              <div class="stat-type">{{ getIpTypeLabel(type as IpType) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 按线路类型统计 -->
      <div v-if="subscriptionInfo.accessibleNodes.byLineType" class="nodes-stats-section">
        <div class="section-title">按线路类型</div>
        <div class="nodes-stats-grid">
          <div
            v-for="(count, type) in subscriptionInfo.accessibleNodes.byLineType"
            :key="type"
            class="nodes-stat-item"
          >
            <div class="stat-icon" :style="getLineTypeStyle(type as LineType)">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-count">{{ count }}</div>
              <div class="stat-type">{{ getLineTypeLabel(type as LineType) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="nodes-action">
        <el-button type="primary" plain @click="goToNodes">
          <el-icon><View /></el-icon>
          查看可用节点
        </el-button>
      </div>
    </el-card>

    <!-- 套餐权益 -->
    <el-card v-if="subscriptionInfo?.features?.length" class="features-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><Tickets /></el-icon>
            套餐权益
          </span>
        </div>
      </template>
      <div class="features-list">
        <div
          v-for="(feature, index) in subscriptionInfo.features"
          :key="index"
          class="feature-item"
        >
          <el-icon color="#67c23a"><CircleCheck /></el-icon>
          <span>{{ feature }}</span>
        </div>
      </div>
    </el-card>

    <!-- 服务类型权限 -->
    <el-card class="permissions-card" shadow="hover">
      <ServiceTypePermissions
        :effective-service-types="subscriptionInfo?.effectiveServiceTypes || []"
        :accessible-nodes="subscriptionInfo?.accessibleNodes?.byType"
        @upgrade="goToPlans"
      />
    </el-card>

    <!-- Subscription URL -->
    <el-card class="url-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>订阅链接</span>
          <el-button type="danger" link @click="resetUuid">
            <el-icon><Refresh /></el-icon>
            重置 UUID
          </el-button>
        </div>
      </template>

      <div class="url-content">
        <div class="url-input-section">
          <el-input
            v-model="subscriptionUrl"
            readonly
            class="url-input"
          >
            <template #append>
              <el-button @click="copyUrl">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </template>
          </el-input>
          <p class="url-tip">在客户端中使用此链接导入订阅</p>
        </div>

        <div class="qr-section">
          <div class="qr-code" v-if="qrCodeUrl">
            <img :src="qrCodeUrl" alt="QR Code" />
          </div>
          <div class="qr-placeholder" v-else>
            <el-icon size="32"><Picture /></el-icon>
          </div>
          <p class="qr-tip">扫描二维码导入</p>
        </div>
      </div>

      <el-divider />

      <div class="client-guide">
        <h4>客户端配置指南</h4>
        <el-collapse>
          <el-collapse-item title="Windows 客户端">
            <p>1. 下载并安装 v2rayN 或 Clash for Windows</p>
            <p>2. 复制订阅链接</p>
            <p>3. 在客户端中点击"订阅" → "订阅设置"</p>
            <p>4. 粘贴链接并更新订阅</p>
          </el-collapse-item>
          <el-collapse-item title="macOS 客户端">
            <p>1. 下载并安装 ClashX 或 V2RayU</p>
            <p>2. 复制订阅链接</p>
            <p>3. 在客户端配置中粘贴订阅链接</p>
            <p>4. 更新订阅即可使用</p>
          </el-collapse-item>
          <el-collapse-item title="Android 客户端">
            <p>1. 下载 v2rayNG 或 Clash for Android</p>
            <p>2. 点击右上角 + 号</p>
            <p>3. 选择"从剪贴板导入"或扫描二维码</p>
            <p>4. 更新订阅并连接</p>
          </el-collapse-item>
          <el-collapse-item title="iOS 客户端">
            <p>1. 下载 Shadowrocket 或 Quantumult X</p>
            <p>2. 点击右上角 + 号</p>
            <p>3. 类型选择"Subscribe"</p>
            <p>4. 粘贴订阅链接并保存</p>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>

    <!-- Subscription History -->
    <el-card class="history-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>订阅记录</span>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="(record, index) in subscriptionHistory"
          :key="index"
          :type="record.type"
          :timestamp="record.time"
        >
          {{ record.content }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Goods,
  Refresh,
  CopyDocument,
  Picture,
  Promotion,
  Medal,
  Lock,
  Cpu,
  TopRight,
  OfficeBuilding,
  CircleCheck,
  Location,
  Connection,
  Monitor,
  View,
  Tickets
} from '@element-plus/icons-vue';
import * as subscriptionApi from '@/api/subscription';
import type { SubscriptionInfo } from '@/types/subscription';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';
import ServiceTypePermissions from '@/components/subscription/ServiceTypePermissions.vue';

const router = useRouter();

// IP类型
enum IpType {
  DATACENTER = 'datacenter',
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',
  RESIDENTIAL_STATIC = 'residential_static',
  MOBILE = 'mobile'
}

// 线路类型
enum LineType {
  STANDARD = 'standard',
  CN2 = 'cn2',
  IEPL = 'iepl',
  IPLC = 'iplc'
}

const subscriptionInfo = ref<SubscriptionInfo | null>(null);
const subscriptionUrl = ref('');
const qrCodeUrl = ref('');
const subscriptionHistory = ref([
  { type: 'primary', time: '2024-01-15 10:30', content: '订阅套餐: 年付套餐' },
  { type: 'success', time: '2024-01-15 10:30', content: '支付成功: ¥199.00' },
  { type: 'info', time: '2024-01-15 10:31', content: '订阅已激活' },
]);

const trafficLimit = computed(() => subscriptionInfo.value?.trafficLimit || 0);
const trafficUsed = computed(() => subscriptionInfo.value?.trafficUsed || 0);
const trafficRemaining = computed(() => subscriptionInfo.value?.trafficRemaining || 0);
const trafficPercentage = computed(() => subscriptionInfo.value?.usagePercent || 0);
const daysRemaining = computed(() => subscriptionInfo.value?.daysRemaining || 0);
const isExpired = computed(() => daysRemaining.value <= 0);

const subscriptionStatusText = computed(() => {
  if (isExpired.value) return '已过期';
  if (daysRemaining.value <= 7) return '即将过期';
  return '正常';
});

const subscriptionStatusType = computed(() => {
  if (isExpired.value) return 'danger';
  if (daysRemaining.value <= 7) return 'warning';
  return 'success';
});

const trafficProgressStatus = computed(() => {
  if (trafficPercentage.value >= 90) return 'exception';
  if (trafficPercentage.value >= 70) return 'warning';
  return '';
});

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: string | null) => {
  if (!date) return '无';
  return new Date(date).toLocaleDateString('zh-CN');
};

const getServiceTypeMeta = (type: ServiceType) => {
  return ServiceTypeMeta[type] || {
    label: type,
    color: '#909399',
    bgColor: '#f5f7fa',
    icon: 'circle'
  };
};

const getGroupIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    plane: Promotion,
    crown: Medal,
    shield: Lock,
    home: Location,
    star: CircleCheck
  };
  return iconMap[iconName] || CircleCheck;
};

const getIpTypeLabel = (type: IpType) => {
  const labels: Record<IpType, string> = {
    [IpType.DATACENTER]: '机房',
    [IpType.RESIDENTIAL_DYNAMIC]: '动态住宅',
    [IpType.RESIDENTIAL_STATIC]: '静态住宅',
    [IpType.MOBILE]: '移动'
  };
  return labels[type] || type;
};

const getIpTypeStyle = (type: IpType) => {
  const styles: Record<IpType, { backgroundColor: string; borderColor: string; color: string }> = {
    [IpType.DATACENTER]: {
      backgroundColor: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    },
    [IpType.RESIDENTIAL_DYNAMIC]: {
      backgroundColor: '#10B98120',
      borderColor: '#10B981',
      color: '#10B981'
    },
    [IpType.RESIDENTIAL_STATIC]: {
      backgroundColor: '#8B5CF620',
      borderColor: '#8B5CF6',
      color: '#8B5CF6'
    },
    [IpType.MOBILE]: {
      backgroundColor: '#F59E0B20',
      borderColor: '#F59E0B',
      color: '#F59E0B'
    }
  };
  return styles[type] || { backgroundColor: '#90939920', borderColor: '#909399', color: '#909399' };
};

const getLineTypeLabel = (type: LineType) => {
  const labels: Record<LineType, string> = {
    [LineType.STANDARD]: '标准',
    [LineType.CN2]: 'CN2',
    [LineType.IEPL]: 'IEPL',
    [LineType.IPLC]: 'IPLC'
  };
  return labels[type] || type;
};

const getLineTypeStyle = (type: LineType) => {
  const styles: Record<LineType, { backgroundColor: string; borderColor: string; color: string }> = {
    [LineType.STANDARD]: {
      backgroundColor: '#6B728020',
      borderColor: '#6B7280',
      color: '#6B7280'
    },
    [LineType.CN2]: {
      backgroundColor: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    },
    [LineType.IEPL]: {
      backgroundColor: '#F59E0B20',
      borderColor: '#F59E0B',
      color: '#F59E0B'
    },
    [LineType.IPLC]: {
      backgroundColor: '#EC489920',
      borderColor: '#EC4899',
      color: '#EC4899'
    }
  };
  return styles[type] || { backgroundColor: '#90939920', borderColor: '#909399', color: '#909399' };
};

const fetchSubscriptionData = async () => {
  try {
    const info = await subscriptionApi.getCurrentSubscription();
    subscriptionInfo.value = info as unknown as typeof subscriptionInfo.value;

    const urlData = await subscriptionApi.getSubscriptionUrl();
    subscriptionUrl.value = (urlData as unknown as { url: string }).url;
    qrCodeUrl.value = (urlData as unknown as { qrCode: string }).qrCode;
  } catch (error) {
    console.error('Failed to fetch subscription data:', error);
  }
};

const copyUrl = () => {
  navigator.clipboard.writeText(subscriptionUrl.value);
  ElMessage.success('订阅链接已复制');
};

const resetUuid = async () => {
  try {
    await ElMessageBox.confirm(
      '重置 UUID 后，旧的订阅链接将失效，需要重新导入客户端。是否继续？',
      '确认重置',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await subscriptionApi.resetSubscriptionUuid();
    ElMessage.success('UUID 已重置');
    fetchSubscriptionData();
  } catch (error) {
    // User cancelled or error
  }
};

const goToPlans = () => {
  router.push('/app/subscription/plans');
};

const goToNodes = () => {
  router.push('/app/nodes');
};

const showRenewDialog = () => {
  router.push('/app/subscription/plans');
};

onMounted(() => {
  fetchSubscriptionData();
});
</script>

<style scoped lang="scss">
.subscription-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .page-subtitle {
    color: #909399;
  }
}

.status-card {
  margin-bottom: 20px;

  .status-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .status-item {
    text-align: center;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;

    .item-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .item-value {
      font-size: 18px;
      font-weight: 600;
      color: #303133;

      &.text-warning {
        color: #e6a23c;
      }
    }
  }

  .plan-group-section {
    margin-bottom: 20px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;

    .section-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 10px;
    }

    .plan-group-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #fff;
      border-radius: 8px;
      border: 2px solid;
      font-weight: 600;
    }
  }

  .access-types-section {
    margin-bottom: 20px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;

    .access-type-group {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 10px;
      }

      .access-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .service-types-section {
    margin-bottom: 20px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;

    .section-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 10px;
    }

    .service-type-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .service-type-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 16px;
      font-weight: 500;

      .el-icon {
        font-size: 12px;
      }
    }
  }

  .bandwidth-section {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    padding: 16px;
    background-color: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #d9f0ff;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: 12px;
    }

    .bandwidth-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #409eff;
        font-size: 18px;
      }

      .bandwidth-label {
        font-size: 13px;
        color: #606266;
      }

      .bandwidth-value {
        font-size: 16px;
        font-weight: 600;
        color: #409eff;
      }
    }
  }

  .progress-section {
    margin-bottom: 24px;

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
    }

    .progress-footer {
      margin-top: 8px;
      text-align: right;
      font-size: 14px;
      color: #909399;
    }
  }

  .action-section {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

.nodes-stats-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      color: #409eff;
    }
  }

  .nodes-stats-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 14px;
      color: #606266;
      margin-bottom: 12px;
      font-weight: 500;
    }
  }

  .nodes-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .nodes-stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #fafafa;
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover {
      background: #f0f0f0;
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      .el-icon {
        font-size: 20px;
      }
    }

    .stat-info {
      .stat-count {
        font-size: 20px;
        font-weight: 700;
        color: #303133;
      }

      .stat-type {
        font-size: 13px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }

  .nodes-action {
    margin-top: 20px;
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}

.features-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;

    .el-icon {
      color: #67c23a;
    }
  }

  .features-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: 8px;
    font-size: 14px;
    color: #606266;

    .el-icon {
      flex-shrink: 0;
    }
  }
}

.permissions-card {
  margin-bottom: 20px;
}

.url-card {
  margin-bottom: 20px;

  .url-content {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .url-input-section {
    flex: 1;

    .url-input {
      margin-bottom: 8px;
    }

    .url-tip {
      font-size: 12px;
      color: #909399;
    }
  }

  .qr-section {
    text-align: center;
    width: 140px;

    .qr-code {
      width: 120px;
      height: 120px;
      margin: 0 auto 8px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .qr-placeholder {
      width: 120px;
      height: 120px;
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      border-radius: 8px;
      color: #909399;
    }

    .qr-tip {
      font-size: 12px;
      color: #909399;
    }
  }

  .client-guide {
    h4 {
      margin-bottom: 16px;
      color: #303133;
    }

    p {
      margin: 8px 0;
      color: #606266;
      font-size: 14px;
    }
  }
}

.history-card {
  .el-timeline {
    padding-left: 8px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
