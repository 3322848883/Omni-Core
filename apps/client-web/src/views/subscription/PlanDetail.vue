<template>
  <div class="plan-detail-page">
    <div class="page-header">
      <div class="breadcrumb">
        <el-button class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回套餐列表
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="planDetail">
      <div class="hero-section" :style="{ borderColor: getGroupColor(planDetail.group_id) }">
        <div class="hero-content">
          <div class="hero-left">
            <div class="plan-badges">
              <div v-if="planDetail.is_recommended || planDetail.recommended" class="badge recommended">
                <el-icon><Star /></el-icon>
                推荐
              </div>
              <div v-if="isCurrentPlan" class="badge current">
                <el-icon><Check /></el-icon>
                当前套餐
              </div>
            </div>
            <h1 class="plan-title">{{ planDetail.name }}</h1>
            <p class="plan-description">{{ planDetail.description }}</p>
            <p class="plan-full-desc" v-if="planDetail.fullDescription">{{ planDetail.fullDescription }}</p>
          </div>
          <div class="hero-right">
            <div class="price-display">
              <span class="currency">¥</span>
              <span class="amount">{{ planDetail.price }}</span>
              <span class="period">/ {{ planDetail.period === 'month' ? '月' : planDetail.period === 'quarter' ? '季' : '年' }}</span>
            </div>
            <el-button
              v-if="!isCurrentPlan"
              class="subscribe-btn"
              @click="handleSubscribe"
            >
              <el-icon><ShoppingCart /></el-icon>
              立即订阅
            </el-button>
            <el-button
              v-else
              class="subscribe-btn disabled"
              disabled
            >
              <el-icon><Check /></el-icon>
              当前套餐
            </el-button>
          </div>
        </div>
        <div class="hero-glow" :style="{ background: getGroupColor(planDetail.group_id) }"></div>
      </div>

      <div class="content-section">
        <div class="info-grid">
          <div class="info-card">
            <div class="card-header">
              <div class="card-icon">
                <el-icon><Location /></el-icon>
              </div>
              <h3>可访问IP类型</h3>
            </div>
            <div class="type-list">
              <div
                v-for="ipType in planDetail.ipTypeDetails"
                :key="ipType.type"
                class="type-item"
                :style="{ borderColor: ipType.color }"
              >
                <div class="type-header">
                  <span class="type-tag" :style="{ background: ipType.color + '20', borderColor: ipType.color, color: ipType.color }">
                    {{ ipType.label }}
                  </span>
                </div>
                <p class="type-desc">{{ ipType.description }}</p>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="card-header">
              <div class="card-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <h3>可访问线路类型</h3>
            </div>
            <div class="type-list">
              <div
                v-for="lineType in planDetail.lineTypeDetails"
                :key="lineType.type"
                class="type-item"
                :style="{ borderColor: lineType.color }"
              >
                <div class="type-header">
                  <span class="type-tag" :style="{ background: lineType.color + '20', borderColor: lineType.color, color: lineType.color }">
                    {{ lineType.label }}
                  </span>
                </div>
                <p class="type-desc">{{ lineType.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="specs-card">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><Cpu /></el-icon>
            </div>
            <h3>套餐规格</h3>
          </div>
          <div class="specs-grid">
            <div class="spec-item">
              <div class="spec-icon">
                <el-icon><Download /></el-icon>
              </div>
              <div class="spec-info">
                <span class="spec-label">流量额度</span>
                <span class="spec-value">{{ formatBytes(planDetail.traffic_limit) }}</span>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">
                <el-icon><Speed /></el-icon>
              </div>
              <div class="spec-info">
                <span class="spec-label">保证带宽</span>
                <span class="spec-value">{{ planDetail.bandwidth }} Mbps</span>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="spec-info">
                <span class="spec-label">设备限制</span>
                <span class="spec-value">{{ planDetail.device_limit }} 台设备</span>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="spec-info">
                <span class="spec-label">可用节点</span>
                <span class="spec-value">{{ planDetail.nodeStats?.total || accessibleNodesCount }} 个</span>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="spec-info">
                <span class="spec-label">有效期</span>
                <span class="spec-value">{{ planDetail.period === 'month' ? '30天' : planDetail.period === 'quarter' ? '90天' : '365天' }}</span>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">
                <el-icon><Rank /></el-icon>
              </div>
              <div class="spec-info">
                <span class="spec-label">优先级</span>
                <span class="spec-value">等级 {{ planDetail.guaranteed_bandwidth >= 200 ? '高' : planDetail.guaranteed_bandwidth >= 100 ? '中' : '标准' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="planDetail.scenarios && planDetail.scenarios.length > 0" class="scenarios-card">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <h3>适用场景</h3>
          </div>
          <div class="scenarios-grid">
            <div
              v-for="(scenario, index) in planDetail.scenarios"
              :key="index"
              class="scenario-item"
            >
              <div class="scenario-icon">
                <el-icon color="#60a5fa"><CircleCheck /></el-icon>
              </div>
              <span>{{ scenario }}</span>
            </div>
          </div>
        </div>

        <div v-if="planDetail.detailedFeatures && planDetail.detailedFeatures.length > 0" class="features-card">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><List /></el-icon>
            </div>
            <h3>套餐特性</h3>
          </div>
          <div class="features-list">
            <div
              v-for="(feature, index) in planDetail.detailedFeatures"
              :key="index"
              class="feature-item"
            >
              <div class="feature-icon">
                <el-icon color="#34d399"><CircleCheck /></el-icon>
              </div>
              <div class="feature-content">
                <div class="feature-title">{{ feature.title }}</div>
                <div class="feature-desc">{{ feature.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="planDetail.nodeStats?.byRegion" class="nodes-card">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><MapLocation /></el-icon>
            </div>
            <h3>节点分布</h3>
          </div>
          <div class="nodes-grid">
            <div
              v-for="(count, region) in planDetail.nodeStats.byRegion"
              :key="region"
              class="region-item"
            >
              <div class="region-name">{{ region }}</div>
              <div class="region-count">
                <span>{{ count }} 个节点</span>
              </div>
            </div>
          </div>
        </div>

        <div class="related-card">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><ScaleToOriginal /></el-icon>
            </div>
            <h3>同组套餐对比</h3>
          </div>
          <div class="related-content">
            <div class="notice">
              <el-icon><InfoFilled /></el-icon>
              <p>查看同套餐组的其他套餐，选择最适合您的方案</p>
            </div>
            <el-button class="view-btn" @click="goToPlans">
              查看 {{ getGroupName(planDetail.group_id) }} 的所有套餐
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-container">
      <div class="empty-icon">
        <el-icon><Warning /></el-icon>
      </div>
      <h2>套餐不存在或已下架</h2>
      <el-button class="back-btn" @click="goBack">
        返回套餐列表
      </el-button>
    </div>

    <el-dialog
      v-model="paymentDialogVisible"
      title="确认订单"
      width="500px"
      :close-on-click-modal="false"
      class="payment-dialog"
    >
      <div class="dialog-content">
        <div v-if="planDetail" class="order-summary">
          <div class="summary-header">
            <div class="summary-icon" :style="{ background: getGroupColor(planDetail.group_id) + '20' }">
              <el-icon :color="getGroupColor(planDetail.group_id)"><Goods /></el-icon>
            </div>
            <div class="summary-info">
              <h3>{{ planDetail.name }}</h3>
              <p>{{ planDetail.description }}</p>
            </div>
          </div>

          <div class="summary-details">
            <div class="detail-row">
              <span class="label">流量额度</span>
              <span class="value">{{ formatBytes(planDetail.traffic_limit) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">保证带宽</span>
              <span class="value">{{ planDetail.bandwidth }} Mbps</span>
            </div>
            <div class="detail-row">
              <span class="label">设备限制</span>
              <span class="value">{{ planDetail.device_limit }} 台</span>
            </div>
          </div>

          <div class="summary-total">
            <span class="total-label">应付金额</span>
            <span class="total-amount">¥{{ planDetail.price.toFixed(2) }}</span>
          </div>
        </div>

        <div class="payment-methods">
          <div class="methods-label">选择支付方式</div>
          <div class="methods-grid">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="method-card"
              :class="{ active: selectedPaymentMethod === method.id }"
              @click="selectedPaymentMethod = method.id"
            >
              <div class="method-icon" :style="{ background: method.color + '20' }">
                <component :is="method.icon" :color="method.color" />
              </div>
              <span class="method-name">{{ method.name }}</span>
              <el-icon v-if="selectedPaymentMethod === method.id" class="check-icon"><CircleCheck /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="paymentDialogVisible = false" class="dialog-btn cancel">取消</el-button>
        <el-button type="primary" :loading="processing" @click="processPayment" class="dialog-btn confirm">
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Star,
  Check,
  ShoppingCart,
  Location,
  Connection,
  Cpu,
  Download,
  Monitor,
  OfficeBuilding,
  Timer,
  Rank,
  List,
  MapLocation,
  ScaleToOriginal,
  CircleCheck,
  Wallet,
  ChatDotRound,
  ArrowLeft,
  Goods,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import * as orderApi from '@/api/orders';
import * as subscriptionApi from '@/api/subscription';
import type { PlanDetail } from '@/types/subscription';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: Wallet, color: '#1677FF' },
  { id: 'wechat', name: '微信支付', icon: ChatDotRound, color: '#07C160' }
];

const groupColors: Record<string, string> = {
  airport_traffic: '#3B82F6',
  dedicated_line: '#F59E0B',
  residential_ip: '#10B981',
  dedicated_ip: '#EC4899'
};

const groupNames: Record<string, string> = {
  airport_traffic: '机场大流量',
  dedicated_line: '专线加速',
  residential_ip: '住宅IP',
  dedicated_ip: '独享IP'
};

const planDetail = ref<PlanDetail | null>(null);
const loading = ref(true);
const paymentDialogVisible = ref(false);
const selectedPaymentMethod = ref('alipay');
const processing = ref(false);

const isCurrentPlan = computed(() => {
  if (!userStore.userInfo?.planName || !planDetail.value) return false;
  return userStore.userInfo.planName === planDetail.value.name;
});

const accessibleNodesCount = computed(() => {
  if (!planDetail.value) return 0;
  const baseCount: Record<string, number> = {
    airport_traffic: 50,
    dedicated_line: 35,
    residential_ip: 20,
    dedicated_ip: 10
  };
  return baseCount[planDetail.value.group_id] || 15;
});

const getGroupColor = (groupId: string) => {
  return groupColors[groupId] || '#3B82F6';
};

const getGroupName = (groupId: string) => {
  return groupNames[groupId] || groupId;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const fetchPlanDetail = async () => {
  const planId = route.params.id as string;
  if (!planId) {
    ElMessage.error('套餐ID不存在');
    return;
  }

  loading.value = true;
  try {
    const response = await subscriptionApi.getPlanById(planId);
    planDetail.value = response.data;
  } catch (error) {
    ElMessage.error('获取套餐详情失败');
    console.error('Failed to fetch plan detail:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/app/subscription/plans');
};

const goToPlans = () => {
  router.push('/app/subscription/plans');
};

const handleSubscribe = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push('/');
    return;
  }
  paymentDialogVisible.value = true;
};

const processPayment = async () => {
  if (!planDetail.value) return;

  processing.value = true;
  try {
    const order = await orderApi.createOrder({
      planId: planDetail.value.id,
      paymentMethod: selectedPaymentMethod.value,
    });

    const paymentInfo = await orderApi.getPaymentInfo(order.id);

    if (paymentInfo.paymentUrl) {
      window.open(paymentInfo.paymentUrl, '_blank');
    }

    ElMessage.success('订单创建成功，请完成支付');
    paymentDialogVisible.value = false;
    router.push(`/orders/${order.id}`);
  } catch (error) {
    ElMessage.error('创建订单失败');
  } finally {
    processing.value = false;
  }
};

onMounted(() => {
  fetchPlanDetail();
});
</script>

<style scoped lang="scss">
.plan-detail-page {
  padding: 0 0 60px;
  min-height: 100vh;
}

.page-header {
  padding: 24px 24px 0;
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 20px;
}

.back-btn {
  padding: 10px 18px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    border-color: rgba(59, 130, 246, 0.4);
    color: #cbd5e1;
    background: rgba(30, 41, 59, 0.8);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3B82F6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    color: #94a3b8;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hero-section {
  position: relative;
  max-width: 1200px;
  margin: 0 auto 28px;
  padding: 32px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 24px;
  border-left: 4px solid;
  overflow: hidden;
  margin-left: 24px;
  margin-right: 24px;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.hero-left {
  flex: 1;
}

.plan-badges {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &.recommended {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    color: #fff;
  }

  &.current {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: #fff;
  }

  .el-icon {
    font-size: 14px;
  }
}

.plan-title {
  font-size: 32px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 10px;
}

.plan-description {
  font-size: 16px;
  color: #94a3b8;
  margin: 0 0 8px;
}

.plan-full-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.hero-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.price-display {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 24px;
  color: #94a3b8;
  margin-right: 4px;
}

.amount {
  font-size: 52px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.period {
  font-size: 16px;
  color: #94a3b8;
  margin-left: 4px;
}

.subscribe-btn {
  width: 220px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #fff;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.4);
  }

  &.disabled {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    cursor: not-allowed;
  }
}

.hero-glow {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.info-card,
.specs-card,
.scenarios-card,
.features-card,
.nodes-card,
.related-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 20px;
  padding: 28px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0;
  }
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 22px;
    color: #60a5fa;
  }
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.type-item {
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  border-left: 3px solid;
}

.type-header {
  margin-bottom: 8px;
}

.type-tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 600;
}

.type-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 14px;
}

.spec-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 22px;
    color: #60a5fa;
  }
}

.spec-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.spec-label {
  font-size: 13px;
  color: #94a3b8;
}

.spec-value {
  font-size: 17px;
  font-weight: 600;
  color: #e2e8f0;
}

.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.scenario-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.15);
  font-size: 14px;
  color: #cbd5e1;
}

.scenario-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  gap: 14px;
  padding: 18px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 14px;
}

.feature-icon {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.feature-content {
  flex: 1;
  min-width: 0;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.feature-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.region-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
}

.region-name {
  font-size: 14px;
  color: #cbd5e1;
  font-weight: 500;
}

.region-count {
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 20px;

  span {
    font-size: 12px;
    color: #93c5fd;
    font-weight: 500;
  }
}

.related-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;

  .el-icon {
    color: #60a5fa;
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }
}

.view-btn {
  padding: 12px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  align-self: center;

  &:hover {
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(245, 158, 11, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;

  .el-icon {
    font-size: 40px;
    color: #fbbf24;
  }
}

.empty-container h2 {
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 20px;
}

.payment-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: #e2e8f0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px 20px;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 24px;
  }
}

.summary-info {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;

  .label {
    color: #94a3b8;
  }

  .value {
    color: #e2e8f0;
    font-weight: 500;
  }
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);

  .total-label {
    font-size: 16px;
    color: #cbd5e1;
    font-weight: 500;
  }

  .total-amount {
    font-size: 28px;
    font-weight: 700;
    color: #60a5fa;
  }
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.methods-label {
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e1;
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.method-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
  }

  &.active {
    border-color: rgba(59, 130, 246, 0.6);
    background: rgba(59, 130, 246, 0.1);
  }
}

.method-icon {
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

.method-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e1;
}

.check-icon {
  color: #34d399;
  font-size: 20px;
}

.dialog-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;

  &.cancel {
    background: rgba(148, 163, 184, 0.1);
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: #94a3b8;

    &:hover {
      background: rgba(148, 163, 184, 0.2);
      border-color: rgba(148, 163, 184, 0.3);
    }
  }

  &.confirm {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
    border: none;

    &:hover {
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
  }
}
</style>
