<template>
  <div class="nodes-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header__content">
        <h1 class="page-title">
          <el-icon class="page-title__icon"><MapLocation /></el-icon>
          节点列表
        </h1>
        <p class="page-subtitle">选择最优节点进行连接</p>
      </div>
      <div class="page-header__actions">
        <el-button type="primary" class="test-all-btn" @click="testAllNodes">
          <el-icon><Odometer /></el-icon>
          测试全部延迟
        </el-button>
      </div>
    </div>

    <!-- 节点统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
            <el-icon size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ nodeStats.online }}</div>
            <div class="stat-label">在线节点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);">
            <el-icon size="24"><Promotion /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ nodeStats.byType?.standard || 0 }}</div>
            <div class="stat-label">标准节点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
            <el-icon size="24"><Medal /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ nodeStats.byType?.dedicated_line || 0 }}</div>
            <div class="stat-label">专线节点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);">
            <el-icon size="24"><Lock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ nodeStats.byType?.exclusive || 0 }}</div>
            <div class="stat-label">独享节点</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-card shadow="never" class="filter-card">
        <div class="filter-content">
          <!-- 服务类型筛选 -->
          <div class="filter-group">
            <span class="filter-label">服务类型:</span>
            <div class="filter-tags">
              <div
                class="filter-tag"
                :class="{ active: selectedServiceType === null }"
                @click="selectedServiceType = null"
              >
                全部
              </div>
              <div
                v-for="(meta, type) in ServiceTypeMeta"
                :key="type"
                class="filter-tag"
                :class="{ active: selectedServiceType === type }"
                :style="selectedServiceType === type ? {
                  backgroundColor: meta.bgColor,
                  borderColor: meta.color,
                  color: meta.color
                } : {}"
                @click="selectedServiceType = selectedServiceType === type ? null : type as ServiceType"
              >
                {{ meta.label }}
              </div>
            </div>
          </div>

          <!-- IP类型筛选 -->
          <div class="filter-group">
            <span class="filter-label">IP类型:</span>
            <div class="filter-tags">
              <div
                class="filter-tag"
                :class="{ active: selectedIpType === null }"
                @click="selectedIpType = null"
              >
                全部
              </div>
              <div
                v-for="(label, type) in ipTypeLabels"
                :key="type"
                class="filter-tag"
                :class="{ active: selectedIpType === type }"
                :style="selectedIpType === type ? getIpTypeStyle(type as IpType) : {}"
                @click="selectedIpType = selectedIpType === type ? null : type as IpType"
              >
                {{ label }}
              </div>
            </div>
          </div>

          <!-- 线路类型筛选 -->
          <div class="filter-group">
            <span class="filter-label">线路类型:</span>
            <div class="filter-tags">
              <div
                class="filter-tag"
                :class="{ active: selectedLineType === null }"
                @click="selectedLineType = null"
              >
                全部
              </div>
              <div
                v-for="(label, type) in lineTypeLabels"
                :key="type"
                class="filter-tag"
                :class="{ active: selectedLineType === type }"
                :style="selectedLineType === type ? getLineTypeStyle(type as LineType) : {}"
                @click="selectedLineType = selectedLineType === type ? null : type as LineType"
              >
                {{ label }}
              </div>
            </div>
          </div>

          <!-- 搜索框 -->
          <div class="filter-search">
            <el-input
              v-model="searchQuery"
              placeholder="搜索节点名称、国家或ISP"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选结果统计 -->
    <div class="filter-stats">
      <el-tag type="info" effect="plain">
        共 {{ filteredNodes.length }} 个节点
        <template v-if="selectedServiceType">
          · {{ ServiceTypeMeta[selectedServiceType].label }}
        </template>
        <template v-if="selectedIpType">
          · {{ ipTypeLabels[selectedIpType] }}
        </template>
        <template v-if="selectedLineType">
          · {{ lineTypeLabels[selectedLineType] }}
        </template>
      </el-tag>
      <el-button
        v-if="hasActiveFilters"
        type="primary"
        link
        size="small"
        @click="clearFilters"
      >
        清除筛选
      </el-button>
    </div>

    <!-- 节点列表 -->
    <div v-if="filteredNodes.length > 0" class="nodes-grid">
      <NodeCard
        v-for="(node, index) in filteredNodes"
        :key="node.id"
        :node="node"
        :style="{ animationDelay: `${index * 50}ms` }"
        @connect="connectNode"
        @test="testNode"
      />
    </div>

    <!-- 空状态 -->
    <el-empty
      v-else-if="!loading"
      :description="emptyDescription"
      class="empty-state"
    >
      <template #image>
        <el-icon size="64" color="#dcdfe6"><OfficeBuilding /></el-icon>
      </template>
      <template #description>
        <div class="empty-description">
          <p>{{ emptyDescription }}</p>
          <p v-if="hasActiveFilters" class="empty-tip">
            请尝试调整筛选条件
          </p>
          <p v-else-if="selectedServiceType" class="empty-tip">
            您的当前套餐不包含{{ ServiceTypeMeta[selectedServiceType].label }}节点访问权限
          </p>
        </div>
      </template>
      <el-button type="primary" @click="goToPlans">升级套餐</el-button>
    </el-empty>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  MapLocation,
  Odometer,
  CircleCheck,
  Promotion,
  Medal,
  Lock,
  Search,
  OfficeBuilding
} from '@element-plus/icons-vue';
import * as nodeApi from '@/api/nodes';
import type { Node, NodeStats } from '@/types/node';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';
import NodeCard from '@/components/nodes/NodeCard.vue';

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

const nodes = ref<Node[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedServiceType = ref<ServiceType | null>(null);
const selectedIpType = ref<IpType | null>(null);
const selectedLineType = ref<LineType | null>(null);

// IP类型标签
const ipTypeLabels: Record<IpType, string> = {
  [IpType.DATACENTER]: '机房',
  [IpType.RESIDENTIAL_DYNAMIC]: '动态住宅',
  [IpType.RESIDENTIAL_STATIC]: '静态住宅',
  [IpType.MOBILE]: '移动'
};

// 线路类型标签
const lineTypeLabels: Record<LineType, string> = {
  [LineType.STANDARD]: '标准',
  [LineType.CN2]: 'CN2',
  [LineType.IEPL]: 'IEPL',
  [LineType.IPLC]: 'IPLC'
};

// 节点统计
const nodeStats = ref<NodeStats>({
  total: 0,
  online: 0,
  byType: {
    [ServiceType.STANDARD]: 0,
    [ServiceType.DEDICATED_LINE]: 0,
    [ServiceType.EXCLUSIVE]: 0,
    [ServiceType.STATIC_RESIDENTIAL]: 0
  }
});

const hasActiveFilters = computed(() => {
  return selectedServiceType.value !== null ||
         selectedIpType.value !== null ||
         selectedLineType.value !== null ||
         searchQuery.value !== '';
});

// 过滤后的节点列表
const filteredNodes = computed(() => {
  let result = nodes.value;

  // 按服务类型筛选
  if (selectedServiceType.value) {
    result = result.filter(node => node.service_type === selectedServiceType.value);
  }

  // 按IP类型筛选
  if (selectedIpType.value) {
    result = result.filter(node => node.ip_type === selectedIpType.value);
  }

  // 按线路类型筛选
  if (selectedLineType.value) {
    result = result.filter(node => node.line_type === selectedLineType.value);
  }

  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (n) =>
        n.name.toLowerCase().includes(query) ||
        n.country.toLowerCase().includes(query) ||
        n.location.toLowerCase().includes(query) ||
        (n.isp_name && n.isp_name.toLowerCase().includes(query))
    );
  }

  return result;
});

// 空状态描述
const emptyDescription = computed(() => {
  if (hasActiveFilters.value) {
    return '未找到符合条件的节点';
  }
  return '暂无可用节点';
});

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

const clearFilters = () => {
  selectedServiceType.value = null;
  selectedIpType.value = null;
  selectedLineType.value = null;
  searchQuery.value = '';
};

const fetchNodes = async () => {
  loading.value = true;
  try {
    // 获取用户有权限访问的节点列表
    const data = await nodeApi.getAccessibleNodes() as unknown as Node[];
    nodes.value = data.map((n) => ({ ...n, testing: false }));

    // 计算统计信息
    calculateStats();
  } catch (error) {
    ElMessage.error('获取节点列表失败');
  } finally {
    loading.value = false;
  }
};

const calculateStats = () => {
  const stats: NodeStats = {
    total: nodes.value.length,
    online: nodes.value.filter(n => n.status === 'online').length,
    byType: {
      [ServiceType.STANDARD]: 0,
      [ServiceType.DEDICATED_LINE]: 0,
      [ServiceType.EXCLUSIVE]: 0,
      [ServiceType.STATIC_RESIDENTIAL]: 0
    }
  };

  nodes.value.forEach(node => {
    if (node.service_type in stats.byType) {
      stats.byType[node.service_type]++;
    }
  });

  nodeStats.value = stats;
};

const testNode = async (node: Node) => {
  node.testing = true;
  try {
    const result = await nodeApi.testNode(node.id);
    node.latency = result.latency;
    ElMessage.success(`${node.name} 延迟: ${result.latency}ms`);
  } catch (error) {
    ElMessage.error('测试失败');
  } finally {
    node.testing = false;
  }
};

const testAllNodes = async () => {
  const onlineNodes = nodes.value.filter((n) => n.status === 'online');
  if (onlineNodes.length === 0) {
    ElMessage.warning('没有在线节点');
    return;
  }

  ElMessage.info('开始测试所有节点...');
  for (const node of onlineNodes) {
    await testNode(node);
  }
  ElMessage.success('测试完成');
};

const connectNode = (node: Node) => {
  ElMessage.success(`已选择节点: ${node.name}`);
  // 实际应用中这里会触发连接逻辑
};

const goToPlans = () => {
  router.push('/app/subscription/plans');
};

onMounted(() => {
  fetchNodes();
});
</script>

<style scoped lang="scss">
.nodes-page {
  padding: var(--space-6, 24px);
  max-width: 1400px;
  margin: 0 auto;
}

// 页面头部
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  &__content {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;

      &__icon {
        color: #409eff;
      }
    }

    .page-subtitle {
      font-size: 14px;
      color: #909399;
    }
  }
}

.test-all-btn {
  background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
  border: none;

  &:hover {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
  }
}

// 统计区域
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
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

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }
}

// 筛选区域
.filter-section {
  margin-bottom: 16px;
}

.filter-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .filter-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    white-space: nowrap;
  }
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 6px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e4e7ed;
    border-color: #c0c4cc;
  }

  &.active {
    background: rgba(64, 158, 255, 0.1);
    border-color: #409eff;
    color: #409eff;
    font-weight: 500;
  }
}

.filter-search {
  width: 100%;
  max-width: 300px;

  @media (max-width: 640px) {
    max-width: 100%;
  }
}

// 筛选结果统计
.filter-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 4px;
}

// 节点网格
.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

// 空状态
.empty-state {
  padding: 60px 0;

  .empty-description {
    text-align: center;

    p {
      margin: 8px 0;
      color: #606266;
    }

    .empty-tip {
      font-size: 13px;
      color: #909399;
    }
  }
}

// 加载状态
.loading-container {
  padding: 40px;
}

// 动画
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

// 响应式
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .nodes-page {
    padding: 16px;
  }

  .nodes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
