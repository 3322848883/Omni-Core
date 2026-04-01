<template>
  <div class="plan-detail-page">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-section">
      <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/subscription/plans' }">套餐列表</el-breadcrumb-item>
        <el-breadcrumb-item>{{ planDetail?.name || '套餐详情' }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else-if="planDetail">
      <!-- 套餐基本信息 -->
      <div class="plan-header-section" :style="{ borderLeftColor: getGroupColor(planDetail.group_id) }">
        <div class="plan-header-content">
          <div class="plan-title-row">
            <h1 class="plan-title">{{ planDetail.name }}</h1>
            <div class="plan-badges">
              <el-tag v-if="planDetail.is_recommended || planDetail.recommended" type="success" effect="dark">
                <el-icon><Star /></el-icon>
                推荐
              </el-tag>
              <el-tag v-if="isCurrentPlan" type="primary" effect="dark">
                <el-icon><Check /></el-icon>
                当前套餐
              </el-tag>
            </div>
          </div>
          <p class="plan-description">{{ planDetail.description }}</p>
          <p class="plan-full-description">{{ planDetail.fullDescription }}</p>
        </div>
        <div class="plan-price-section">
          <div class="price-display">
            <span class="currency">¥</span>
            <span class="amount">{{ planDetail.price }}</span>
            <span class="period">/ {{ planDetail.period === 'month' ? '月' : planDetail.period === 'quarter' ? '季' : '年' }}</span>
          </div>
          <el-button
            v-if="!isCurrentPlan"
            type="primary"
            size="large"
            class="subscribe-btn"
            @click="handleSubscribe"
          >
            <el-icon><ShoppingCart /></el-icon>
            立即订阅
          </el-button>
          <el-button
            v-else
            type="success"
            size="large"
            disabled
            class="subscribe-btn"
          >
            <el-icon><Check /></el-icon>
            当前套餐
          </el-button>
        </div>
      </div>

      <!-- IP类型和线路类型 -->
      <el-row :gutter="20" class="info-section">
        <el-col :xs="24" :lg="12">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Location /></el-icon>
                <span>可访问IP类型</span>
              </div>
            </template>
            <div class="ip-types-list">
              <div
                v-for="ipType in planDetail.ipTypeDetails"
                :key="ipType.type"
                class="ip-type-item"
                :style="{ borderLeftColor: ipType.color }"
              >
                <div class="ip-type-header">
                  <el-tag
                    size="small"
                    :style="{
                      backgroundColor: ipType.color + '20',
                      borderColor: ipType.color,
                      color: ipType.color
                    }"
                  >
                    {{ ipType.label }}
                  </el-tag>
                </div>
                <p class="ip-type-description">{{ ipType.description }}</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Connection /></el-icon>
                <span>可访问线路类型</span>
              </div>
            </template>
            <div class="line-types-list">
              <div
                v-for="lineType in planDetail.lineTypeDetails"
                :key="lineType.type"
                class="line-type-item"
                :style="{ borderLeftColor: lineType.color }"
              >
                <div class="line-type-header">
                  <el-tag
                    size="small"
                    :style="{
                      backgroundColor: lineType.color + '20',
                      borderColor: lineType.color,
                      color: lineType.color
                    }"
                  >
                    {{ lineType.label }}
                  </el-tag>
                </div>
                <p class="line-type-description">{{ lineType.description }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 套餐规格 -->
      <el-card class="specs-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Cpu /></el-icon>
            <span>套餐规格</span>
          </div>
        </template>
        <div class="specs-grid">
          <div class="spec-item">
            <div class="spec-icon">
              <el-icon><Download /></el-icon>
            </div>
            <div class="spec-content">
              <div class="spec-label">流量额度</div>
              <div class="spec-value">{{ formatBytes(planDetail.traffic_limit) }}</div>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-icon">
              <el-icon><Speed /></el-icon>
            </div>
            <div class="spec-content">
              <div class="spec-label">保证带宽</div>
              <div class="spec-value">{{ planDetail.bandwidth }} Mbps</div>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="spec-content">
              <div class="spec-label">设备限制</div>
              <div class="spec-value">{{ planDetail.device_limit }} 台设备</div>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="spec-content">
              <div class="spec-label">可用节点</div>
              <div class="spec-value">{{ planDetail.nodeStats?.total || accessibleNodesCount }} 个</div>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="spec-content">
              <div class="spec-label">有效期</div>
              <div class="spec-value">{{ planDetail.period === 'month' ? '30天' : planDetail.period === 'quarter' ? '90天' : '365天' }}</div>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-icon">
              <el-icon><Rank /></el-icon>
            </div>
            <div class="spec-content">
              <div class="spec-label">优先级</div>
              <div class="spec-value">等级 {{ planDetail.guaranteed_bandwidth >= 200 ? '高' : planDetail.guaranteed_bandwidth >= 100 ? '中' : '标准' }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 适用场景 -->
      <el-card v-if="planDetail.scenarios && planDetail.scenarios.length > 0" class="scenarios-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Target /></el-icon>
            <span>适用场景</span>
          </div>
        </template>
        <div class="scenarios-grid">
          <div
            v-for="(scenario, index) in planDetail.scenarios"
            :key="index"
            class="scenario-item"
          >
            <el-icon :size="24" color="#409eff"><Check /></el-icon>
            <span>{{ scenario }}</span>
          </div>
        </div>
      </el-card>

      <!-- 详细特性 -->
      <el-card v-if="planDetail.detailedFeatures && planDetail.detailedFeatures.length > 0" class="features-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><List /></el-icon>
            <span>套餐特性</span>
          </div>
        </template>
        <div class="features-list">
          <div
            v-for="(feature, index) in planDetail.detailedFeatures"
            :key="index"
            class="feature-item"
          >
            <div class="feature-icon">
              <el-icon :size="20" color="#67c23a"><CircleCheck /></el-icon>
            </div>
            <div class="feature-content">
              <div class="feature-title">{{ feature.title }}</div>
              <div class="feature-description">{{ feature.description }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 节点分布 -->
      <el-card v-if="planDetail.nodeStats?.byRegion" class="nodes-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><MapLocation /></el-icon>
            <span>节点分布</span>
          </div>
        </template>
        <div class="nodes-stats">
          <div
            v-for="(count, region) in planDetail.nodeStats.byRegion"
            :key="region"
            class="region-item"
          >
            <div class="region-name">{{ region }}</div>
            <div class="region-count">
              <el-tag type="info" effect="plain">{{ count }} 个节点</el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 套餐对比 -->
      <el-card class="compare-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><ScaleToOriginal /></el-icon>
            <span>同组套餐对比</span>
          </div>
        </template>
        <div class="compare-notice">
          <el-alert
            title="提示"
            type="info"
            description="查看同套餐组的其他套餐，选择最适合您的方案"
            :closable="false"
            show-icon
          />
        </div>
        <div class="related-plans">
          <el-button
            type="primary"
            @click="goToPlans"
          >
            查看 {{ getGroupName(planDetail.group_id) }} 的所有套餐
          </el-button>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="套餐不存在或已下架" />

    <!-- 支付对话框 -->
    <el-dialog
      v-model="paymentDialogVisible"
      title="确认订单"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="order-summary" v-if="planDetail">
        <div class="order-item">
          <span class="label">套餐名称</span>
          <span class="value">{{ planDetail.name }}</span>
        </div>
        <div class="order-item">
          <span class="label">流量额度</span>
          <span class="value">{{ formatBytes(planDetail.traffic_limit) }}</span>
        </div>
        <div class="order-item">
          <span class="label">保证带宽</span>
          <span class="value">{{ planDetail.bandwidth }} Mbps</span>
        </div>
        <div class="order-item">
          <span class="label">设备限制</span>
          <span class="value">{{ planDetail.device_limit }} 台</span>
        </div>
        <el-divider />
        <div class="order-item total">
          <span class="label">应付金额</span>
          <span class="value price">¥{{ planDetail.price.toFixed(2) }}</span>
        </div>
      </div>

      <div class="payment-methods">
        <h4>选择支付方式</h4>
        <el-radio-group v-model="selectedPaymentMethod">
          <el-radio label="alipay">
            <div class="payment-option">
              <el-icon size="20"><Wallet /></el-icon>
              <span>支付宝</span>
            </div>
          </el-radio>
          <el-radio label="wechat">
            <div class="payment-option">
              <el-icon size="20"><ChatDotRound /></el-icon>
              <span>微信支付</span>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="processing" @click="processPayment">
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
  ChatDotRound
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import * as orderApi from '@/api/orders';
import * as subscriptionApi from '@/api/subscription';
import type { PlanDetail } from '@/types/subscription';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const planDetail = ref<PlanDetail | null>(null);
const loading = ref(false);
const paymentDialogVisible = ref(false);
const selectedPaymentMethod = ref('alipay');
const processing = ref(false);

// 套餐组颜色映射
const groupColors: Record<string, string> = {
  airport_traffic: '#3B82F6',
  dedicated_line: '#F59E0B',
  residential_ip: '#10B981',
  dedicated_ip: '#EC4899'
};

// 套餐组名称映射
const groupNames: Record<string, string> = {
  airport_traffic: '机场大流量',
  dedicated_line: '专线加速',
  residential_ip: '住宅IP',
  dedicated_ip: '独享IP'
};

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
  return groupColors[groupId] || '#409eff';
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
    router.push(`/app/orders/${order.id}`);
  } catch (error) {
    ElMessage.error('创建订单失败');
  } finally {
    processing.value = false;
  }
};

const goToPlans = () => {
  router.push('/app/subscription/plans');
};

onMounted(() => {
  fetchPlanDetail();
});
</script>

<style scoped lang="scss">
.plan-detail-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb-section {
  margin-bottom: 20px;
}

.loading-container {
  padding: 40px;
}

// 套餐头部
.plan-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  border-left: 4px solid;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.plan-header-content {
  flex: 1;

  .plan-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .plan-title {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .plan-badges {
      display: flex;
      gap: 8px;

      .el-tag {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .plan-description {
    font-size: 16px;
    color: #606266;
    margin-bottom: 8px;
  }

  .plan-full-description {
    font-size: 14px;
    color: #909399;
    line-height: 1.6;
  }
}

.plan-price-section {
  text-align: center;

  .price-display {
    margin-bottom: 16px;

    .currency {
      font-size: 24px;
      color: #f56c6c;
      font-weight: 500;
    }

    .amount {
      font-size: 48px;
      font-weight: 700;
      color: #f56c6c;
      margin: 0 4px;
    }

    .period {
      font-size: 16px;
      color: #909399;
    }
  }

  .subscribe-btn {
    width: 200px;
    background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
    border: none;
    font-weight: 500;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    }
  }
}

// 信息区域
.info-section {
  margin-bottom: 20px;
}

.info-card {
  height: 100%;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
}

.ip-types-list,
.line-types-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ip-type-item,
.line-type-item {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid;

  .ip-type-header,
  .line-type-header {
    margin-bottom: 6px;
  }

  .ip-type-description,
  .line-type-description {
    font-size: 13px;
    color: #606266;
    margin: 0;
  }
}

// 规格卡片
.specs-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;

  .spec-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 10px;
    color: #409eff;

    .el-icon {
      font-size: 20px;
    }
  }

  .spec-content {
    .spec-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .spec-value {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
}

// 场景卡片
.scenarios-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
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
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  color: #303133;
  font-size: 14px;
}

// 特性卡片
.features-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;

  .feature-icon {
    flex-shrink: 0;
  }

  .feature-content {
    .feature-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .feature-description {
      font-size: 13px;
      color: #606266;
    }
  }
}

// 节点卡片
.nodes-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
}

.nodes-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.region-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;

  .region-name {
    font-size: 14px;
    color: #606266;
  }
}

// 对比卡片
.compare-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
}

.compare-notice {
  margin-bottom: 20px;
}

.related-plans {
  text-align: center;
}

// 支付对话框
.order-summary {
  .order-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;

    &.total {
      font-weight: 600;
      font-size: 16px;

      .price {
        color: #f56c6c;
        font-size: 20px;
      }
    }

    .label {
      color: #606266;
    }

    .value {
      color: #303133;
    }
  }
}

.payment-methods {
  margin-top: 24px;

  h4 {
    margin-bottom: 16px;
    color: #303133;
  }

  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .el-radio {
    margin-right: 0;
    height: auto;
  }

  .payment-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
  }
}
</style>
