<template>
  <div class="subscription-page">
    <div class="page-hero">
      <div class="hero-content">
        <h1 class="hero-title">我的订阅</h1>
        <p class="hero-subtitle">管理您的订阅信息和服务权限</p>
      </div>
      <div class="hero-accent"></div>
    </div>

    <div class="content-section">
      <div class="status-card">
        <div class="card-header">
          <div class="header-left">
            <div class="status-icon">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="header-info">
              <h2>订阅状态</h2>
              <span class="status-badge" :class="subscriptionStatusType">
                <el-icon><CircleCheck /></el-icon>
                {{ subscriptionStatusText }}
              </span>
            </div>
          </div>
        </div>

        <div class="status-grid">
          <div class="status-item">
            <div class="item-icon">
              <el-icon><Memo /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-label">套餐类型</span>
              <span class="item-value">{{ subscriptionInfo?.planName || '暂无订阅' }}</span>
            </div>
          </div>
          <div class="status-item">
            <div class="item-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-label">到期时间</span>
              <span class="item-value">{{ formatDate(subscriptionInfo?.expireDate || null) }}</span>
            </div>
          </div>
          <div class="status-item">
            <div class="item-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-label">剩余天数</span>
              <span class="item-value" :class="{ 'warning': daysRemaining <= 7 }">
                {{ daysRemaining > 0 ? `${daysRemaining} 天` : '已过期' }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="subscriptionInfo?.planGroup" class="plan-group-section">
          <div class="section-label">套餐组</div>
          <div class="plan-group-tag" :style="{ borderColor: subscriptionInfo.planGroup.color }">
            <div class="tag-icon" :style="{ background: subscriptionInfo.planGroup.color + '20' }">
              <component :is="getGroupIcon(subscriptionInfo.planGroup.icon)" :size="18" :color="subscriptionInfo.planGroup.color" />
            </div>
            <span :style="{ color: subscriptionInfo.planGroup.color }">{{ subscriptionInfo.planGroup.name }}</span>
          </div>
        </div>

        <div v-if="subscriptionInfo?.ipTypes?.length || subscriptionInfo?.lineTypes?.length" class="access-types-section">
          <div class="access-type-group" v-if="subscriptionInfo?.ipTypes?.length">
            <div class="section-label">可访问IP类型</div>
            <div class="access-tags">
              <div
                v-for="type in subscriptionInfo.ipTypes"
                :key="type"
                class="access-tag"
                :style="getIpTypeStyle(type)"
              >
                {{ getIpTypeLabel(type) }}
              </div>
            </div>
          </div>
          <div class="access-type-group" v-if="subscriptionInfo?.lineTypes?.length">
            <div class="section-label">可访问线路类型</div>
            <div class="access-tags">
              <div
                v-for="type in subscriptionInfo.lineTypes"
                :key="type"
                class="access-tag"
                :style="getLineTypeStyle(type)"
              >
                {{ getLineTypeLabel(type) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="subscriptionInfo?.effectiveServiceTypes?.length" class="service-types-section">
          <div class="section-label">当前服务类型</div>
          <div class="service-type-tags">
            <div
              v-for="type in subscriptionInfo.effectiveServiceTypes"
              :key="type"
              class="service-type-tag"
              :style="{
                background: getServiceTypeMeta(type).bgColor,
                borderColor: getServiceTypeMeta(type).color,
                color: getServiceTypeMeta(type).color
              }"
            >
              <el-icon v-if="getServiceTypeMeta(type).icon === 'plane'"><Promotion /></el-icon>
              <el-icon v-else-if="getServiceTypeMeta(type).icon === 'crown'"><Medal /></el-icon>
              <el-icon v-else-if="getServiceTypeMeta(type).icon === 'shield'"><Lock /></el-icon>
              {{ getServiceTypeMeta(type).label }}
            </div>
          </div>
        </div>

        <div v-if="subscriptionInfo" class="bandwidth-section">
          <div class="bandwidth-item">
            <div class="bw-icon">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="bw-info">
              <span class="bw-label">保证带宽</span>
              <span class="bw-value">{{ subscriptionInfo.guaranteedBandwidth || 20 }} Mbps</span>
            </div>
          </div>
          <div class="bandwidth-item">
            <div class="bw-icon">
              <el-icon><TopRight /></el-icon>
            </div>
            <div class="bw-info">
              <span class="bw-label">优先级等级</span>
              <span class="bw-value">{{ subscriptionInfo.priorityLevel || 1 }}</span>
            </div>
          </div>
          <div class="bandwidth-item" v-if="subscriptionInfo?.deviceLimit">
            <div class="bw-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="bw-info">
              <span class="bw-label">设备限制</span>
              <span class="bw-value">{{ subscriptionInfo.deviceLimit }} 台</span>
            </div>
          </div>
        </div>

        <div class="traffic-section">
          <div class="traffic-header">
            <div class="header-left">
              <div class="traffic-icon">
                <el-icon><Download /></el-icon>
              </div>
              <div class="traffic-info">
                <span class="traffic-title">流量使用</span>
                <span class="traffic-stats">{{ formatBytes(trafficUsed) }} / {{ formatBytes(trafficLimit) }}</span>
              </div>
            </div>
            <div class="traffic-percentage">{{ trafficPercentage }}%</div>
          </div>
          <div class="traffic-bar">
            <div class="traffic-progress" :class="trafficProgressStatus" :style="{ width: trafficPercentage + '%' }"></div>
          </div>
          <div class="traffic-footer">
            <span class="remaining-label">剩余流量</span>
            <span class="remaining-value">{{ formatBytes(trafficRemaining) }}</span>
          </div>
        </div>

        <div class="action-section">
          <el-button class="action-btn primary" @click="goToPlans">
            <el-icon><ShoppingCart /></el-icon>
            升级套餐
          </el-button>
          <el-button v-if="!isExpired" class="action-btn outline" @click="showRenewDialog">
            <el-icon><Refresh /></el-icon>
            续费订阅
          </el-button>
        </div>
      </div>

      <div v-if="subscriptionInfo?.accessibleNodes" class="nodes-card">
        <div class="card-header">
          <div class="header-left">
            <div class="card-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="header-info">
              <h2>可访问节点</h2>
              <span class="node-count">共 {{ subscriptionInfo.accessibleNodes.total }} 个</span>
            </div>
          </div>
        </div>

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
                  background: getServiceTypeMeta(type as ServiceType).bgColor,
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
          <el-button class="action-btn primary" @click="goToNodes">
            <el-icon><View /></el-icon>
            查看可用节点
          </el-button>
        </div>
      </div>

      <div v-if="subscriptionInfo?.features?.length" class="features-card">
        <div class="card-header">
          <div class="header-left">
            <div class="card-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <h2>套餐权益</h2>
          </div>
        </div>
        <div class="features-list">
          <div
            v-for="(feature, index) in subscriptionInfo.features"
            :key="index"
            class="feature-item"
          >
            <div class="feature-icon">
              <el-icon color="#34d399"><CircleCheck /></el-icon>
            </div>
            <span>{{ feature }}</span>
          </div>
        </div>
      </div>

      <div class="url-card">
        <div class="card-header">
          <div class="header-left">
            <div class="card-icon">
              <el-icon><Link /></el-icon>
            </div>
            <h2>订阅链接</h2>
          </div>
          <el-button class="reset-btn" @click="resetUuid">
            <el-icon><Refresh /></el-icon>
            重置 UUID
          </el-button>
        </div>

        <div class="url-content">
          <div class="url-input-section">
            <div class="url-input-wrapper">
              <input v-model="subscriptionUrl" readonly class="url-input" />
              <el-button class="copy-btn" @click="copyUrl">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
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

        <div class="client-guide">
          <div class="guide-header">
            <el-icon><Document /></el-icon>
            <h3>客户端配置指南</h3>
          </div>
          <div class="guide-tabs">
            <div
              v-for="(guide, index) in clientGuides"
              :key="index"
              class="guide-tab"
              :class="{ active: activeGuide === index }"
              @click="activeGuide = index"
            >
              <el-icon><component :is="guide.icon" /></el-icon>
              {{ guide.name }}
            </div>
          </div>
          <div class="guide-content">
            <p v-for="(step, index) in clientGuides[activeGuide].steps" :key="index">
              {{ index + 1 }}. {{ step }}
            </p>
          </div>
        </div>
      </div>

      <div class="history-card">
        <div class="card-header">
          <div class="header-left">
            <div class="card-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <h2>订阅记录</h2>
          </div>
        </div>
        <div class="timeline">
          <div
            v-for="(record, index) in subscriptionHistory"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-dot" :class="record.type"></div>
            <div class="timeline-content">
              <div class="timeline-time">{{ record.time }}</div>
              <div class="timeline-text">{{ record.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  Tickets,
  Link,
  ShoppingCart,
  Memo,
  Calendar,
  Timer,
  Download,
  Document,
  Clock
} from '@element-plus/icons-vue';
import * as subscriptionApi from '@/api/subscription';
import type { SubscriptionInfo } from '@/types/subscription';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';

const router = useRouter();

enum IpType {
  DATACENTER = 'datacenter',
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',
  RESIDENTIAL_STATIC = 'residential_static',
  MOBILE = 'mobile'
}

enum LineType {
  STANDARD = 'standard',
  CN2 = 'cn2',
  IEPL = 'iepl',
  IPLC = 'iplc'
}

const clientGuides = [
  {
    name: 'Windows',
    icon: Monitor,
    steps: [
      '下载并安装 v2rayN 或 Clash for Windows',
      '复制订阅链接',
      '在客户端中点击"订阅" → "订阅设置"',
      '粘贴链接并更新订阅'
    ]
  },
  {
    name: 'macOS',
    icon: Monitor,
    steps: [
      '下载并安装 ClashX 或 V2RayU',
      '复制订阅链接',
      '在客户端配置中粘贴订阅链接',
      '更新订阅即可使用'
    ]
  },
  {
    name: 'Android',
    icon: Monitor,
    steps: [
      '下载 v2rayNG 或 Clash for Android',
      '点击右上角 + 号',
      '选择"从剪贴板导入"或扫描二维码',
      '更新订阅并连接'
    ]
  },
  {
    name: 'iOS',
    icon: Monitor,
    steps: [
      '下载 Shadowrocket 或 Quantumult X',
      '点击右上角 + 号',
      '类型选择"Subscribe"',
      '粘贴订阅链接并保存'
    ]
  }
];

const subscriptionInfo = ref<SubscriptionInfo | null>(null);
const subscriptionUrl = ref('');
const qrCodeUrl = ref('');
const activeGuide = ref(0);
const subscriptionHistory = ref([
  { type: 'primary', time: '2024-01-15 10:30', content: '订阅套餐: 年付套餐' },
  { type: 'success', time: '2024-01-15 10:30', content: '支付成功: ¥199.00' },
  { type: 'info', time: '2024-01-15 10:31', content: '订阅已激活' },
]);

const trafficLimit = computed(() => subscriptionInfo.value?.trafficLimit || 0);
const trafficUsed = computed(() => subscriptionInfo.value?.trafficUsed || 0);
const trafficRemaining = computed(() => subscriptionInfo.value?.trafficRemaining || 0);
const trafficPercentage = computed(() => Math.min(subscriptionInfo.value?.usagePercent || 0, 100));
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
  if (trafficPercentage.value >= 90) return 'danger';
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
  const styles: Record<IpType, { background: string; borderColor: string; color: string }> = {
    [IpType.DATACENTER]: {
      background: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    },
    [IpType.RESIDENTIAL_DYNAMIC]: {
      background: '#10B98120',
      borderColor: '#10B981',
      color: '#10B981'
    },
    [IpType.RESIDENTIAL_STATIC]: {
      background: '#8B5CF620',
      borderColor: '#8B5CF6',
      color: '#8B5CF6'
    },
    [IpType.MOBILE]: {
      background: '#F59E0B20',
      borderColor: '#F59E0B',
      color: '#F59E0B'
    }
  };
  return styles[type] || { background: '#90939920', borderColor: '#909399', color: '#909399' };
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
  const styles: Record<LineType, { background: string; borderColor: string; color: string }> = {
    [LineType.STANDARD]: {
      background: '#6B728020',
      borderColor: '#6B7280',
      color: '#6B7280'
    },
    [LineType.CN2]: {
      background: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    },
    [LineType.IEPL]: {
      background: '#F59E0B20',
      borderColor: '#F59E0B',
      color: '#F59E0B'
    },
    [LineType.IPLC]: {
      background: '#EC489920',
      borderColor: '#EC4899',
      color: '#EC4899'
    }
  };
  return styles[type] || { background: '#90939920', borderColor: '#909399', color: '#909399' };
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
  padding: 0 0 60px;
  min-height: 100vh;
}

.page-hero {
  position: relative;
  padding: 60px 24px 40px;
  text-align: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
    animation: pulse 8s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 16px;
  color: #94a3b8;
  margin: 0;
}

.hero-accent {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #3B82F6, #EC4899, transparent);
  border-radius: 2px;
}

.content-section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-card,
.nodes-card,
.features-card,
.url-card,
.history-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 20px;
  padding: 28px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #e2e8f0;
      margin: 0;
    }
  }
}

.status-icon,
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 24px;
    color: #60a5fa;
  }
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;

  &.success {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }

  &.danger {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .el-icon {
    font-size: 14px;
  }
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
}

.item-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 20px;
    color: #60a5fa;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.item-label {
  font-size: 13px;
  color: #94a3b8;
}

.item-value {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;

  &.warning {
    color: #fbbf24;
  }
}

.plan-group-section,
.access-types-section,
.service-types-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
}

.section-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.plan-group-tag {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 2px solid;
  font-weight: 600;
}

.tag-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.access-type-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.access-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.access-tag {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
}

.service-type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.service-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid;
  font-weight: 600;
  font-size: 13px;

  .el-icon {
    font-size: 14px;
  }
}

.bandwidth-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.bandwidth-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.bw-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 18px;
    color: #60a5fa;
  }
}

.bw-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bw-label {
  font-size: 13px;
  color: #94a3b8;
}

.bw-value {
  font-size: 16px;
  font-weight: 600;
  color: #60a5fa;
}

.traffic-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
}

.traffic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.traffic-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 18px;
    color: #34d399;
  }
}

.traffic-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.traffic-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.traffic-stats {
  font-size: 13px;
  color: #94a3b8;
}

.traffic-percentage {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.traffic-bar {
  height: 12px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.traffic-progress {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #10B981 100%);
  border-radius: 6px;
  transition: width 0.5s ease;

  &.warning {
    background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
  }

  &.danger {
    background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%);
  }
}

.traffic-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.remaining-label {
  color: #94a3b8;
}

.remaining-value {
  color: #34d399;
  font-weight: 600;
}

.action-section {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;

  &.primary {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
    color: #fff;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.outline {
    background: transparent;
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: #94a3b8;

    &:hover {
      border-color: rgba(148, 163, 184, 0.4);
      background: rgba(148, 163, 184, 0.1);
    }
  }
}

.node-count {
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  font-size: 12px;
  color: #93c5fd;
  font-weight: 500;
}

.nodes-stats-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 14px;
  font-weight: 500;
}

.nodes-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.nodes-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(15, 23, 42, 0.8);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 20px;
  }
}

.stat-info {
  .stat-count {
    font-size: 20px;
    font-weight: 700;
    color: #e2e8f0;
  }

  .stat-type {
    font-size: 13px;
    color: #94a3b8;
    margin-top: 2px;
  }
}

.nodes-action {
  margin-top: 24px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
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
  gap: 10px;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 10px;
  font-size: 14px;
  color: #cbd5e1;
}

.feature-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.reset-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }
}

.url-content {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.url-input-section {
  flex: 1;
}

.url-input-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: rgba(59, 130, 246, 0.5);
  }
}

.copy-btn {
  padding: 12px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;

  &:hover {
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }
}

.url-tip {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.qr-section {
  text-align: center;
  width: 140px;
  flex-shrink: 0;
}

.qr-code {
  width: 120px;
  height: 120px;
  margin: 0 auto 10px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  padding: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.qr-placeholder {
  width: 120px;
  height: 120px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 10px;
  color: #64748b;
}

.qr-tip {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.client-guide {
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  .el-icon {
    color: #60a5fa;
    font-size: 20px;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0;
  }
}

.guide-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.guide-tab {
  flex: 1;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
  }

  &.active {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.5);
    color: #93c5fd;
  }
}

.guide-content {
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 10px;

  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 6px 0;
    line-height: 1.6;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  gap: 14px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;

  &.primary {
    background: #3B82F6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }

  &.success {
    background: #10B981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }

  &.info {
    background: #6B7280;
    box-shadow: 0 0 10px rgba(107, 114, 128, 0.5);
  }
}

.timeline-content {
  flex: 1;
}

.timeline-time {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.timeline-text {
  font-size: 14px;
  color: #cbd5e1;
}
</style>
