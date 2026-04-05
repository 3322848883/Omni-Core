<template>
  <div class="plans-page">
    <div class="page-hero">
      <div class="hero-content">
        <h1 class="hero-title">升级套餐</h1>
        <p class="hero-subtitle">选择适合您的订阅方案，享受更优质的服务</p>
      </div>
      <div class="hero-accent"></div>
    </div>

    <div class="plan-group-tabs">
      <div
        v-for="group in planGroups"
        :key="group.id"
        class="group-tab"
        :class="{ active: selectedGroup === group.id }"
        @click="selectedGroup = selectedGroup === group.id ? null : group.id"
      >
        <div class="tab-icon" :style="{ background: group.gradient }">
          <component :is="getGroupIcon(group.icon)" />
        </div>
        <div class="tab-info">
          <div class="tab-name">{{ group.name }}</div>
          <div class="tab-desc">{{ group.shortDesc }}</div>
        </div>
        <div class="tab-glow" :style="{ background: group.color }"></div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selectedGroupInfo" class="group-detail-panel">
        <div class="detail-header">
          <div class="detail-icon" :style="{ background: selectedGroupInfo.color + '20' }">
            <component :is="getGroupIcon(selectedGroupInfo.icon)" :size="28" :color="selectedGroupInfo.color" />
          </div>
          <div class="detail-info">
            <h3 :style="{ color: selectedGroupInfo.color }">{{ selectedGroupInfo.name }}</h3>
            <p>{{ selectedGroupInfo.description }}</p>
          </div>
        </div>
        <div class="detail-features">
          <div
            v-for="feature in selectedGroupInfo.features"
            :key="feature"
            class="feature-tag"
            :style="{ borderColor: selectedGroupInfo.color, color: selectedGroupInfo.color }"
          >
            <el-icon><CircleCheck /></el-icon>
            {{ feature }}
          </div>
        </div>
      </div>
    </transition>

    <div class="plans-section">
      <div v-for="group in filteredPlanGroups" :key="group.id" class="plan-group">
        <div class="group-section-header">
          <div class="section-title-row">
            <div class="section-icon" :style="{ background: group.color + '20' }">
              <component :is="getGroupIcon(group.icon)" :size="20" :color="group.color" />
            </div>
            <h2 class="section-title">{{ group.name }}</h2>
            <span class="plan-count">{{ group.plans.length }} 个套餐</span>
          </div>
        </div>

        <div class="plans-grid">
          <div
            v-for="plan in group.plans"
            :key="plan.id"
            class="plan-card"
            :class="{
              'is-current': isCurrentPlan(plan),
              'is-recommended': plan.is_recommended || plan.recommended
            }"
          >
            <div class="plan-accent" :style="{ background: group.gradient || group.color }"></div>
            
            <div v-if="plan.is_recommended || plan.recommended" class="recommended-badge">
              <el-icon><Star /></el-icon>
              推荐
            </div>
            
            <div v-if="isCurrentPlan(plan)" class="current-badge">
              <el-icon><Check /></el-icon>
              当前套餐
            </div>

            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <p class="plan-desc">{{ plan.description }}</p>
            </div>

            <div class="plan-price">
              <span class="currency">¥</span>
              <span class="amount">{{ plan.price }}</span>
              <span class="period">/{{ plan.period === 'month' ? '月' : plan.period === 'quarter' ? '季' : '年' }}</span>
            </div>

            <div class="plan-specs">
              <div class="spec-item">
                <el-icon><Download /></el-icon>
                <span>{{ formatBytes(plan.traffic_limit) }} 流量</span>
              </div>
              <div class="spec-item">
                <el-icon><CircleCheck /></el-icon>
                <span>{{ plan.bandwidth }} Mbps 带宽</span>
              </div>
              <div class="spec-item">
                <el-icon><Monitor /></el-icon>
                <span>{{ plan.device_limit }} 台设备</span>
              </div>
            </div>

            <div class="plan-features">
              <div v-for="(feature, index) in (plan.features || []).slice(0, 4)" :key="index" class="feature-row">
                <el-icon color="#67c23a"><CircleCheck /></el-icon>
                <span>{{ feature }}</span>
              </div>
            </div>

            <div class="plan-actions">
              <el-button
                v-if="!isCurrentPlan(plan)"
                class="action-btn primary"
                @click="handleSubscribe(plan)"
              >
                立即订阅
              </el-button>
              <el-button
                v-else
                class="action-btn secondary"
                disabled
              >
                当前套餐
              </el-button>
              <el-button class="action-btn outline" @click="handleViewDetail(plan)">
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredPlanGroups.length === 0" description="暂无符合条件的套餐" />

    <div class="faq-section">
      <div class="faq-header">
        <h2 class="faq-title">常见问题</h2>
        <p class="faq-subtitle">解答您的疑惑</p>
      </div>
      <div class="faq-list">
        <div
          v-for="(faq, index) in faqList"
          :key="index"
          class="faq-item"
          :class="{ active: expandedFaq === index }"
          @click="expandedFaq = expandedFaq === index ? null : index"
        >
          <div class="faq-question">
            <span>{{ faq.question }}</span>
            <el-icon class="faq-icon"><ArrowDown /></el-icon>
          </div>
          <div class="faq-answer">
            <div v-if="faq.answerHtml" v-html="faq.answerHtml"></div>
            <p v-else>{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="paymentDialogVisible"
      title="确认订单"
      width="500px"
      :close-on-click-modal="false"
      class="payment-dialog"
    >
      <div class="dialog-content">
        <div v-if="selectedPlan" class="order-summary">
          <div class="summary-header">
            <div class="summary-icon" :style="{ background: getGroupColor(selectedPlan.group_id) + '20' }">
              <el-icon :color="getGroupColor(selectedPlan.group_id)"><Goods /></el-icon>
            </div>
            <div class="summary-info">
              <h3>{{ selectedPlan.name }}</h3>
              <p>{{ selectedPlan.description }}</p>
            </div>
          </div>

          <div class="summary-details">
            <div class="detail-row">
              <span class="label">流量额度</span>
              <span class="value">{{ formatBytes(selectedPlan.traffic_limit) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">保证带宽</span>
              <span class="value">{{ selectedPlan.bandwidth }} Mbps</span>
            </div>
            <div class="detail-row">
              <span class="label">设备限制</span>
              <span class="value">{{ selectedPlan.device_limit }} 台</span>
            </div>
          </div>

          <div class="summary-total">
            <span class="total-label">应付金额</span>
            <span class="total-amount">¥{{ selectedPlan.price.toFixed(2) }}</span>
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
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Check,
  Star,
  CircleCheck,
  Download,
  Monitor,
  Goods,
  ArrowDown,
  Wallet,
  ChatDotRound,
  Promotion,
  Medal,
  Lock,
  HomeFilled
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import * as subscriptionApi from '@/api/subscription';
import * as orderApi from '@/api/orders';
import type { Plan, PlanGroup } from '@/types/subscription';

const router = useRouter();
const userStore = useUserStore();

interface PlanWithSelection extends Plan {
  selected?: boolean;
}

const planGroups = ref<PlanGroup[]>([
  {
    id: 'airport_traffic',
    name: '机场大流量',
    shortDesc: '大流量下载',
    description: '机房IP，超大流量，适合大流量下载、视频观看和日常使用',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    icon: 'plane',
    features: ['机房IP', '超大流量', '性价比高', '多节点覆盖'],
    scenarios: ['大流量下载', '视频观看', '日常浏览', '文件传输']
  },
  {
    id: 'dedicated_line',
    name: '专线加速',
    shortDesc: '低延迟游戏',
    description: 'CN2/IEPL/IPLC专线，低延迟高稳定，适合游戏加速和实时应用',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    icon: 'crown',
    features: ['CN2/IEPL/IPLC专线', '低延迟', '高稳定性', '游戏加速'],
    scenarios: ['游戏加速', '视频会议', '实时交易', '直播推流']
  },
  {
    id: 'residential_ip',
    name: '住宅IP',
    shortDesc: '流媒体解锁',
    description: '真实家庭宽带IP，适合流媒体解锁、账号注册和防追踪',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    icon: 'home',
    features: ['真实住宅IP', '高匿名性', '防追踪', '流媒体友好'],
    scenarios: ['流媒体解锁', '账号注册', '社交媒体', '隐私保护']
  },
  {
    id: 'dedicated_ip',
    name: '独享IP',
    shortDesc: '企业级服务',
    description: '独立IP资源，单用户专用，适合企业用户和高安全需求场景',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    icon: 'star',
    features: ['独立IP', '单用户专用', '最高安全性', '企业级SLA'],
    scenarios: ['企业业务', '跨境电商', '高安全需求', '长期稳定业务']
  }
]);

const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: Wallet, color: '#1677FF' },
  { id: 'wechat', name: '微信支付', icon: ChatDotRound, color: '#07C160' }
];

const faqList = [
  {
    question: '如何升级套餐？',
    answer: '选择您想要的套餐，点击"立即订阅"按钮，完成支付后即可自动升级。'
  },
  {
    question: '不同套餐组有什么区别？',
    answerHtml: `
      <p><strong>机场大流量：</strong>机房IP，适合大流量下载和视频观看。</p>
      <p><strong>专线加速：</strong>CN2/IEPL/IPLC专线，低延迟高稳定，适合游戏和实时应用。</p>
      <p><strong>住宅IP：</strong>真实家庭宽带IP，适合流媒体解锁和账号注册。</p>
      <p><strong>独享IP：</strong>独立IP资源，单用户专用，适合企业用户和高安全需求场景。</p>
    `
  },
  {
    question: 'IP类型有什么区别？',
    answerHtml: `
      <p><strong>机房IP：</strong>数据中心IP，带宽大价格低，适合下载和观看视频。</p>
      <p><strong>住宅IP：</strong>真实家庭宽带IP，可信度高，适合注册账号和访问敏感服务。</p>
      <p><strong>独享IP：</strong>独立IP不共享，安全性最高，适合企业业务。</p>
    `
  },
  {
    question: '线路类型有什么区别？',
    answerHtml: `
      <p><strong>标准线路：</strong>普通国际线路，性价比高。</p>
      <p><strong>CN2：</strong>中国电信下一代承载网，延迟较低。</p>
      <p><strong>IEPL：</strong>国际以太网专线，稳定性高。</p>
      <p><strong>IPLC：</strong>国际私有租用电路，延迟最低，稳定性最高。</p>
    `
  },
  {
    question: '升级后流量会叠加吗？',
    answer: '是的，升级后新套餐的流量会叠加到您的账户中。'
  },
  {
    question: '支持哪些支付方式？',
    answer: '我们支持支付宝、微信支付等多种支付方式。'
  },
  {
    question: '可以退款吗？',
    answer: '购买后7天内，如未使用流量，可申请退款。'
  }
];

const plans = ref<PlanWithSelection[]>([]);
const loading = ref(false);
const paymentDialogVisible = ref(false);
const selectedPlan = ref<Plan | null>(null);
const selectedPaymentMethod = ref('alipay');
const processing = ref(false);
const selectedGroup = ref<string | null>(null);
const expandedFaq = ref<number | null>(null);

const getGroupIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    plane: Promotion,
    crown: Medal,
    shield: Lock,
    home: HomeFilled,
    star: Star
  };
  return iconMap[iconName] || CircleCheck;
};

const getGroupColor = (groupId: string) => {
  const group = planGroups.value.find(g => g.id === groupId);
  return group?.color || '#3B82F6';
};

const selectedGroupInfo = computed(() => {
  if (!selectedGroup.value) return null;
  return planGroups.value.find(g => g.id === selectedGroup.value) || null;
});

const groupedPlans = computed(() => {
  const groups: Record<string, PlanWithSelection[]> = {};
  planGroups.value.forEach(group => {
    groups[group.id] = plans.value.filter(plan => plan.group_id === group.id);
  });
  return groups;
});

const filteredPlanGroups = computed(() => {
  if (selectedGroup.value) {
    const group = planGroups.value.find(g => g.id === selectedGroup.value);
    if (group) {
      return [{
        ...group,
        plans: groupedPlans.value[group.id] || []
      }];
    }
  }
  return planGroups.value.map(group => ({
    ...group,
    plans: groupedPlans.value[group.id] || []
  })).filter(group => group.plans.length > 0);
});

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isCurrentPlan = (plan: Plan) => {
  if (!userStore.userInfo?.planName) return false;
  return userStore.userInfo.planName === plan.name;
};

const fetchPlans = async () => {
  loading.value = true;
  try {
    const response = await subscriptionApi.getPlanList();
    plans.value = (response as unknown as Plan[]).map(plan => ({
      ...plan,
      selected: false
    }));
  } catch (error) {
    ElMessage.error('获取套餐列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSubscribe = (plan: Plan) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push('/');
    return;
  }
  selectedPlan.value = plan;
  paymentDialogVisible.value = true;
};

const handleViewDetail = (plan: Plan) => {
  router.push(`/app/subscription/plans/${plan.id}`);
};

const processPayment = async () => {
  if (!selectedPlan.value) return;

  processing.value = true;
  try {
    const order = await orderApi.createOrder({
      planId: selectedPlan.value.id,
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
  fetchPlans();
});
</script>

<style scoped lang="scss">
.plans-page {
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

.plan-group-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 0 24px 32px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.group-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
    background: rgba(30, 41, 59, 0.8);
  }

  &.active {
    border-color: rgba(59, 130, 246, 0.8);
    background: rgba(59, 130, 246, 0.1);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
  }
}

.tab-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 24px;
    color: #fff;
  }
}

.tab-info {
  flex: 1;
  text-align: left;
}

.tab-name {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.tab-desc {
  font-size: 12px;
  color: #94a3b8;
}

.tab-glow {
  position: absolute;
  top: 50%;
  right: -20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0;
  transition: opacity 0.3s ease;

  .group-tab.active & {
    opacity: 0.5;
  }
}

.group-detail-panel {
  max-width: 1400px;
  margin: 0 auto 32px;
  padding: 0 24px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 16px 16px 0 0;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-bottom: none;
}

.detail-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-info {
  flex: 1;

  h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

.detail-features {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px 24px 24px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 0 0 16px 16px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-top: none;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;

  .el-icon {
    font-size: 14px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.plans-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.plan-group {
  margin-bottom: 48px;
}

.group-section-header {
  margin-bottom: 24px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.plan-count {
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  font-size: 12px;
  color: #93c5fd;
  font-weight: 500;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.plan-card {
  position: relative;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 20px;
  padding: 32px 24px 24px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  &.is-recommended {
    border-color: rgba(245, 158, 11, 0.4);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 0.6) 100%);
  }

  &.is-current {
    border-color: rgba(16, 185, 129, 0.5);
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%);
  }
}

.plan-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.recommended-badge,
.current-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  .el-icon {
    font-size: 14px;
  }
}

.recommended-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #fff;
}

.current-badge {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
}

.plan-header {
  margin-bottom: 24px;
}

.plan-name {
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 8px;
}

.plan-desc {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.plan-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 24px;
}

.currency {
  font-size: 20px;
  color: #94a3b8;
  margin-right: 4px;
}

.amount {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.period {
  font-size: 14px;
  color: #94a3b8;
  margin-left: 4px;
}

.plan-specs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #cbd5e1;

  .el-icon {
    color: #60a5fa;
    font-size: 16px;
  }
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  min-height: 100px;
}

.feature-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;

  .el-icon {
    flex-shrink: 0;
  }
}

.plan-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;

  &.primary {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
    color: #fff;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.secondary {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    cursor: not-allowed;
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

.faq-section {
  max-width: 900px;
  margin: 60px auto 0;
  padding: 0 24px;
}

.faq-header {
  text-align: center;
  margin-bottom: 32px;
}

.faq-title {
  font-size: 28px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 8px;
}

.faq-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
  }

  &.active {
    border-color: rgba(59, 130, 246, 0.5);
  }
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #e2e8f0;
}

.faq-icon {
  color: #60a5fa;
  transition: transform 0.3s ease;

  .faq-item.active & {
    transform: rotate(180deg);
  }
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: 0 20px;

  .faq-item.active & {
    max-height: 500px;
    padding: 0 20px 18px;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 8px 0;
    line-height: 1.6;

    strong {
      color: #cbd5e1;
    }
  }
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
