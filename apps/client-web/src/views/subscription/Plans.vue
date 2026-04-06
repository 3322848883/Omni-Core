<template>
  <div class="plans-page">
    <div class="page-header">
      <h1 class="page-title">升级套餐</h1>
      <p class="page-subtitle">选择适合您的订阅方案，享受更优质的服务</p>
    </div>

    <!-- 套餐组标签页 -->
    <div class="plan-groups-section">
      <div class="plan-group-tabs">
        <div
          v-for="group in planGroups"
          :key="group.id"
          class="group-tab"
          :class="{ active: selectedGroup === group.id }"
          :style="selectedGroup === group.id ? {
            backgroundColor: group.color + '20',
            borderColor: group.color,
            color: group.color
          } : {}"
          @click="selectedGroup = selectedGroup === group.id ? null : group.id"
        >
          <div class="tab-icon">
            <el-icon v-if="group.icon === 'plane'" :size="24"><Promotion /></el-icon>
            <el-icon v-else-if="group.icon === 'crown'" :size="24"><Medal /></el-icon>
            <el-icon v-else-if="group.icon === 'shield'" :size="24"><Lock /></el-icon>
            <el-icon v-else-if="group.icon === 'home'" :size="24"><HomeFilled /></el-icon>
            <el-icon v-else-if="group.icon === 'star'" :size="24"><Star /></el-icon>
            <el-icon v-else :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="tab-content">
            <div class="tab-name">{{ group.name }}</div>
            <div class="tab-desc">{{ group.shortDesc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 套餐组详情说明 -->
    <el-collapse-transition>
      <div v-if="selectedGroupInfo" class="group-info-card">
        <el-card :style="{ borderLeft: `4px solid ${selectedGroupInfo.color}` }" shadow="never">
          <div class="group-info-content">
            <div class="group-info-header">
              <h3 :style="{ color: selectedGroupInfo.color }">{{ selectedGroupInfo.name }}</h3>
              <p>{{ selectedGroupInfo.description }}</p>
            </div>
            <div class="group-features">
              <div class="feature-tags">
                <el-tag
                  v-for="feature in selectedGroupInfo.features"
                  :key="feature"
                  size="small"
                  effect="plain"
                  :style="{
                    borderColor: selectedGroupInfo.color,
                    color: selectedGroupInfo.color,
                    backgroundColor: selectedGroupInfo.color + '10'
                  }"
                >
                  {{ feature }}
                </el-tag>
              </div>
            </div>
            <div class="group-scenarios">
              <div class="scenario-title">适用场景：</div>
              <div class="scenario-tags">
                <el-tag
                  v-for="scenario in selectedGroupInfo.scenarios"
                  :key="scenario"
                  size="small"
                  type="info"
                >
                  {{ scenario }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-collapse-transition>

    <!-- 套餐对比开关 -->
    <div class="compare-section">
      <el-switch
        v-model="showComparison"
        active-text="显示套餐对比"
        inline-prompt
      />
      <el-button
        v-if="selectedPlansForCompare.length > 0"
        type="primary"
        link
        @click="clearComparison"
      >
        清除选择 ({{ selectedPlansForCompare.length }})
      </el-button>
    </div>

    <!-- 套餐对比表格 -->
    <el-collapse-transition>
      <div v-if="showComparison && selectedPlansForCompare.length > 0" class="comparison-table">
        <el-card shadow="never">
          <template #header>
            <div class="comparison-header">
              <span>套餐对比</span>
              <el-button type="primary" link @click="showComparison = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="comparisonData" style="width: 100%">
            <el-table-column prop="feature" label="对比项" width="150" fixed />
            <el-table-column
              v-for="plan in selectedPlansForCompare"
              :key="plan.id"
              :label="plan.name"
              min-width="200"
            >
              <template #default="{ row }">
                <div v-if="row.key === 'group'" class="compare-text">
                  {{ getGroupName(plan.group_id) }}
                </div>
                <div v-else-if="row.key === 'ipTypes'" class="compare-tags">
                  <el-tag
                    v-for="type in plan.ip_types"
                    :key="type"
                    size="small"
                    class="compare-tag"
                    :style="getIpTypeStyle(type)"
                  >
                    {{ getIpTypeLabel(type) }}
                  </el-tag>
                </div>
                <div v-else-if="row.key === 'lineTypes'" class="compare-tags">
                  <el-tag
                    v-for="type in plan.line_types"
                    :key="type"
                    size="small"
                    class="compare-tag"
                    :style="getLineTypeStyle(type)"
                  >
                    {{ getLineTypeLabel(type) }}
                  </el-tag>
                </div>
                <div v-else-if="row.key === 'price'" class="compare-price">
                  ¥{{ plan.price }}
                </div>
                <div v-else-if="row.key === 'traffic'">
                  {{ formatBytes(plan.traffic_limit) }}
                </div>
                <div v-else-if="row.key === 'bandwidth'">
                  {{ plan.bandwidth }} Mbps
                </div>
                <div v-else-if="row.key === 'connections'">
                  {{ plan.device_limit }} 设备
                </div>
                <div v-else>
                  <el-icon v-if="row[plan.id]" color="#67c23a"><Check /></el-icon>
                  <el-icon v-else color="#909399"><Close /></el-icon>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-collapse-transition>

    <!-- 套餐列表 - 按组展示 -->
    <div v-for="group in filteredPlanGroups" :key="group.id" class="plan-group-section">
      <div class="group-header" :style="{ borderLeftColor: group.color }">
        <div class="group-title">
          <el-icon :size="20" :color="group.color">
            <component :is="getGroupIcon(group.icon)" />
          </el-icon>
          <span>{{ group.name }}</span>
          <el-tag size="small" :style="{ backgroundColor: group.color + '20', color: group.color, borderColor: group.color }">
            {{ group.plans.length }} 个套餐
          </el-tag>
        </div>
        <p class="group-desc">{{ group.description }}</p>
      </div>

      <el-row :gutter="20" class="plans-grid">
        <el-col
          v-for="plan in group.plans"
          :key="plan.id"
          :xs="24"
          :sm="12"
          :lg="8"
          class="plan-col"
        >
          <div class="plan-wrapper">
            <el-checkbox
              v-if="showComparison"
              v-model="plan.selected"
              class="compare-checkbox"
              @change="(val: boolean) => handlePlanSelect(plan, val)"
            >
              对比
            </el-checkbox>
            <PlanCard
              :plan="plan"
              :is-current="isCurrentPlan(plan)"
              :accessible-nodes="getAccessibleNodesCount(plan)"
              @subscribe="handleSubscribe"
              @view-detail="handleViewDetail"
            />
          </div>
        </el-col>
      </el-row>
    </div>

    <el-empty v-if="filteredPlanGroups.length === 0" description="暂无符合条件的套餐" />

    <!-- FAQ Section -->
    <el-card class="faq-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>常见问题</span>
        </div>
      </template>
      <el-collapse>
        <el-collapse-item title="如何升级套餐？">
          <p>选择您想要的套餐，点击"立即订阅"按钮，完成支付后即可自动升级。</p>
        </el-collapse-item>
        <el-collapse-item title="不同套餐组有什么区别？">
          <p><strong>机场大流量：</strong>机房IP，适合大流量下载和视频观看。</p>
          <p><strong>专线加速：</strong>CN2/IEPL/IPLC专线，低延迟高稳定，适合游戏和实时应用。</p>
          <p><strong>住宅IP：</strong>真实家庭宽带IP，适合流媒体解锁和账号注册。</p>
          <p><strong>独享IP：</strong>独立IP资源，单用户专用，适合企业用户和高安全需求场景。</p>
        </el-collapse-item>
        <el-collapse-item title="IP类型有什么区别？">
          <p><strong>机房IP：</strong>数据中心IP，带宽大价格低，适合下载和观看视频。</p>
          <p><strong>住宅IP：</strong>真实家庭宽带IP，可信度高，适合注册账号和访问敏感服务。</p>
          <p><strong>独享IP：</strong>独立IP不共享，安全性最高，适合企业业务。</p>
        </el-collapse-item>
        <el-collapse-item title="线路类型有什么区别？">
          <p><strong>标准线路：</strong>普通国际线路，性价比高。</p>
          <p><strong>CN2：</strong>中国电信下一代承载网，延迟较低。</p>
          <p><strong>IEPL：</strong>国际以太网专线，稳定性高。</p>
          <p><strong>IPLC：</strong>国际私有租用电路，延迟最低，稳定性最高。</p>
        </el-collapse-item>
        <el-collapse-item title="升级后流量会叠加吗？">
          <p>是的，升级后新套餐的流量会叠加到您的账户中。</p>
        </el-collapse-item>
        <el-collapse-item title="支持哪些支付方式？">
          <p>我们支持支付宝、微信支付等多种支付方式。</p>
        </el-collapse-item>
        <el-collapse-item title="可以退款吗？">
          <p>购买后7天内，如未使用流量，可申请退款。</p>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- Payment Dialog -->
    <el-dialog
      v-model="paymentDialogVisible"
      title="确认订单"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="order-summary" v-if="selectedPlan">
        <div class="order-item">
          <span class="label">套餐名称</span>
          <span class="value">{{ selectedPlan.name }}</span>
        </div>
        <div class="order-item">
          <span class="label">套餐类型</span>
          <span class="value">
            <el-tag
              v-for="type in selectedPlan.ip_types"
              :key="type"
              size="small"
              class="order-tag"
              :style="getIpTypeStyle(type)"
            >
              {{ getIpTypeLabel(type) }}
            </el-tag>
          </span>
        </div>
        <div class="order-item">
          <span class="label">线路类型</span>
          <span class="value">
            <el-tag
              v-for="type in selectedPlan.line_types"
              :key="type"
              size="small"
              class="order-tag"
              :style="getLineTypeStyle(type)"
            >
              {{ getLineTypeLabel(type) }}
            </el-tag>
          </span>
        </div>
        <div class="order-item">
          <span class="label">保证带宽</span>
          <span class="value">{{ selectedPlan.bandwidth }} Mbps</span>
        </div>
        <div class="order-item">
          <span class="label">流量额度</span>
          <span class="value">{{ formatBytes(selectedPlan.traffic_limit) }}</span>
        </div>
        <el-divider />
        <div class="order-item total">
          <span class="label">应付金额</span>
          <span class="value price">¥{{ selectedPlan.price.toFixed(2) }}</span>
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
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Check,
  Close,
  Wallet,
  ChatDotRound,
  Promotion,
  Medal,
  Lock,
  HomeFilled,
  Star,
  CircleCheck
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import * as subscriptionApi from '@/api/subscription';
import * as orderApi from '@/api/orders';
import type { Plan, PlanGroup } from '@/types/subscription';
import { IpType, LineType } from '@/types/subscription';
import PlanCard from '@/components/plans/PlanCard.vue';

const router = useRouter();
const userStore = useUserStore();

// 扩展 Plan 类型以支持选择状态
interface PlanWithSelection extends Plan {
  selected?: boolean;
}

// 套餐组配置
// 套餐组定义 - 与后端数据库中的 group_id 匹配
const planGroups = ref<PlanGroup[]>([
  {
    id: 'standard',
    name: '标准套餐',
    shortDesc: '入门到专业',
    description: '标准套餐系列，包含入门版到专业版，适合各种使用场景',
    color: '#6366F1',
    icon: 'plane',
    features: ['多节点选择', '稳定连接', '性价比高', '适合日常使用'],
    scenarios: ['日常浏览', '视频观看', '轻度下载', '办公使用']
  },
  {
    id: 'dedicated_line',
    name: '专线加速',
    shortDesc: '低延迟游戏',
    description: 'CN2/IEPL/IPLC专线，低延迟高稳定，适合游戏加速和实时应用',
    color: '#F59E0B',
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
    icon: 'star',
    features: ['独立IP', '单用户专用', '最高安全性', '企业级SLA'],
    scenarios: ['企业业务', '跨境电商', '高安全需求', '长期稳定业务']
  }
]);

const plans = ref<PlanWithSelection[]>([]);
const loading = ref(false);
const paymentDialogVisible = ref(false);
const selectedPlan = ref<Plan | null>(null);
const selectedPaymentMethod = ref('alipay');
const processing = ref(false);
const selectedGroup = ref<string | null>(null);
const showComparison = ref(false);

// 获取图标组件
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

// 选中的套餐组信息
const selectedGroupInfo = computed(() => {
  if (!selectedGroup.value) return null;
  return planGroups.value.find(g => g.id === selectedGroup.value) || null;
});

// 按套餐组组织的套餐列表
const groupedPlans = computed(() => {
  const groups: Record<string, PlanWithSelection[]> = {};
  planGroups.value.forEach(group => {
    groups[group.id] = plans.value.filter(plan => plan.group_id === group.id);
  });
  return groups;
});

// 过滤后的套餐组
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

// 选中的对比套餐
const selectedPlansForCompare = computed(() => {
  return plans.value.filter(plan => plan.selected);
});

// 对比表格数据
const comparisonData = computed(() => [
  { key: 'group', feature: '套餐组' },
  { key: 'ipTypes', feature: 'IP类型' },
  { key: 'lineTypes', feature: '线路类型' },
  { key: 'price', feature: '价格' },
  { key: 'traffic', feature: '流量额度' },
  { key: 'bandwidth', feature: '保证带宽' },
  { key: 'connections', feature: '设备限制' },
  ...plans.value[0]?.features.map((_, index) => ({
    key: `feature_${index}`,
    feature: `特性 ${index + 1}`,
    ...Object.fromEntries(plans.value.map(p => [p.id, p.features[index]]))
  })) || []
]);

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

const getAccessibleNodesCount = (plan: Plan) => {
  // 从套餐数据中获取可访问节点数，如果没有则返回0
  return plan.nodeStats?.total || 0;
};

const getGroupName = (groupId: string) => {
  const group = planGroups.value.find(g => g.id === groupId);
  return group?.name || groupId;
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

const handlePlanSelect = (plan: PlanWithSelection, selected: boolean) => {
  if (selected && selectedPlansForCompare.value.length >= 3) {
    ElMessage.warning('最多只能选择3个套餐进行对比');
    plan.selected = false;
    return;
  }
  plan.selected = selected;
};

const clearComparison = () => {
  plans.value.forEach(plan => plan.selected = false);
};

const fetchPlans = async () => {
  loading.value = true;
  try {
    console.log('[fetchPlans] Fetching plans...');
    const response = await subscriptionApi.getPlanList();
    console.log('[fetchPlans] Raw response:', response);
    console.log('[fetchPlans] Response type:', typeof response);
    console.log('[fetchPlans] Is array:', Array.isArray(response));
    
    // Handle different response formats
    let planList: Plan[] = [];
    if (Array.isArray(response)) {
      planList = response;
    } else if (response && typeof response === 'object') {
      // Check if response has items property
      if ('items' in response && Array.isArray(response.items)) {
        planList = response.items;
      } else if ('data' in response && Array.isArray(response.data)) {
        planList = response.data;
      } else {
        console.error('[fetchPlans] Unexpected response format:', response);
      }
    }
    
    console.log('[fetchPlans] Plan list:', planList);
    console.log('[fetchPlans] Plan count:', planList.length);
    
    // 为每个套餐添加选择状态
    plans.value = planList.map(plan => ({
      ...plan,
      selected: false
    }));
    
    console.log('[fetchPlans] Plans after mapping:', plans.value);
  } catch (error) {
    console.error('[fetchPlans] Error:', error);
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
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;

  .page-title {
    font-size: 32px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .page-subtitle {
    color: var(--text-tertiary);
    font-size: 16px;
  }
}

// 套餐组标签页
.plan-groups-section {
  margin-bottom: 24px;
}

.plan-group-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.group-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(26, 26, 37, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(99, 102, 241, 0.1),
      transparent
    );
    transition: left 0.6s;
  }

  &:hover {
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 102, 241, 0.15);

    &::before {
      left: 100%;
    }

    .tab-icon {
      transform: scale(1.1) rotate(5deg);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2));
    }
  }

  &.active {
    border-color: transparent;
    background: linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
                linear-gradient(135deg, #6366f1, #ec4899) border-box;
    animation: border-glow 3s ease-in-out infinite;

    .tab-icon {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(236, 72, 153, 0.3));
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
    }
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }

  .tab-content {
    flex: 1;

    .tab-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--text-primary);
      transition: color 0.3s ease;
    }

    .tab-desc {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }
}

// 套餐组详情
.group-info-card {
  margin-bottom: 24px;

  .group-info-content {
    padding: 8px;
  }

  .group-info-header {
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    p {
      color: #606266;
      font-size: 14px;
    }
  }

  .group-features {
    margin-bottom: 16px;

    .feature-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .group-scenarios {
    .scenario-title {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }

    .scenario-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}

.compare-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 8px;
}

.comparison-table {
  margin-bottom: 30px;

  .comparison-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .compare-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .compare-tag {
    margin: 0;
  }

  .compare-price {
    color: #f56c6c;
    font-weight: 600;
    font-size: 16px;
  }

  .compare-text {
    color: #606266;
  }
}

// 套餐组区域
.plan-group-section {
  margin-bottom: 40px;
}

.group-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: rgba(26, 26, 37, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  border-left: 4px solid;
  border: 1px solid rgba(255, 255, 255, 0.08);

  .group-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);

    .el-tag {
      font-size: 12px;
    }
  }

  .group-desc {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
  }
}

.plans-grid {
  margin-bottom: 20px;
}

.plan-col {
  margin-bottom: 20px;
}

.plan-wrapper {
  position: relative;
  height: 100%;

  .compare-checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
  }
}

.faq-card {
  .el-collapse {
    border: none;
  }
}

.order-summary {
  .order-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;

    &.total {
      font-weight: 600;
      font-size: 16px;

      .price {
        color: var(--color-danger);
        font-size: 20px;
      }
    }

    .label {
      color: var(--text-secondary);
    }

    .value {
      color: var(--text-primary);
      display: flex;
      gap: 4px;

      .order-tag {
        margin: 0;
      }
    }
  }
}

.payment-methods {
  margin-top: 24px;

  h4 {
    margin-bottom: 16px;
    color: var(--text-primary);
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

.card-header {
  font-weight: 600;
}
</style>
