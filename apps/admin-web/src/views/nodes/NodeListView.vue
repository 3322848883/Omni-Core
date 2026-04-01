<template>
  <div class="node-list">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409eff;">
              <el-icon :size="24" color="#fff"><Collection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-title">总节点数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67c23a;">
              <el-icon :size="24" color="#fff"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.online }}</div>
              <div class="stat-title">活跃节点</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6a23c;">
              <el-icon :size="24" color="#fff"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.offline }}</div>
              <div class="stat-title">离线节点</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <el-icon :size="24" color="#fff"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalConnections }}</div>
              <div class="stat-title">在线连接</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Service Type Stats -->
    <el-row :gutter="20" class="service-type-stats-row">
      <el-col :xs="24" :sm="8" v-for="type in serviceTypes" :key="type">
        <el-card class="service-type-stat-card" shadow="hover">
          <div class="type-stat-content">
            <div
              class="type-icon"
              :style="{ backgroundColor: getServiceTypeBgColor(type), color: getServiceTypeColor(type) }"
            >
              <el-icon :size="24">
                <component :is="getIconComponent(getServiceTypeIcon(type))" />
              </el-icon>
            </div>
            <div class="type-stat-info">
              <div class="type-name">{{ getServiceTypeLabel(type) }}</div>
              <div class="type-count">
                <span class="node-count">{{ serviceTypeStats[type]?.nodeCount || 0 }} 节点</span>
                <span class="divider">|</span>
                <span class="user-count">{{ serviceTypeStats[type]?.userCount || 0 }} 用户</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>节点列表</span>
          <el-button type="primary" @click="handleCreate">添加节点</el-button>
        </div>
      </template>

      <!-- Filters -->
      <NodeFilters
        v-model="queryForm"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- Batch Actions -->
      <BatchActions
        v-model:selectedIds="selectedNodeIds"
        :totalCount="nodeList.length"
        @select-all="handleSelectAll"
        @batch-change-service-type="handleBatchChangeServiceType"
        @batch-enable="handleBatchEnable"
        @batch-disable="handleBatchDisable"
        @batch-delete="handleBatchDelete"
      />

      <!-- Table -->
      <el-table
        :data="nodeList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
        row-key="id"
      >
        <el-table-column type="selection" width="55" reserve-selection />
        <el-table-column prop="name" label="节点名称" width="150" />
        <el-table-column prop="host" label="主机" width="150" show-overflow-tooltip />
        <el-table-column prop="port" label="端口" width="70" />

        <!-- Service Type Column -->
        <el-table-column label="服务类型" width="120">
          <template #default="{ row }">
            <el-tag
              :color="getServiceTypeBgColor(row.serviceType)"
              :style="{ color: getServiceTypeColor(row.serviceType), borderColor: getServiceTypeColor(row.serviceType) }"
              effect="plain"
              size="small"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="getIconComponent(getServiceTypeIcon(row.serviceType))" />
              </el-icon>
              {{ getServiceTypeLabel(row.serviceType) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- IP Type Column -->
        <el-table-column label="IP类型" width="110">
          <template #default="{ row }">
            <el-tag
              :type="getIpTypeTagType(row.ipType)"
              size="small"
              effect="light"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="getIpTypeIcon(row.ipType)" />
              </el-icon>
              {{ getIpTypeLabel(row.ipType) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Line Type Column -->
        <el-table-column label="线路类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getLineTypeTagType(row.lineType)"
              size="small"
              effect="plain"
            >
              {{ getLineTypeLabel(row.lineType) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- ISP Column -->
        <el-table-column label="ISP" width="120">
          <template #default="{ row }">
            <span v-if="row.isp" class="isp-text">{{ row.isp }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <!-- IP Score Column -->
        <el-table-column label="IP评分" width="100">
          <template #default="{ row }">
            <div class="ip-score" v-if="row.ipScore !== undefined">
              <el-progress
                :percentage="row.ipScore"
                :color="getIpScoreColor(row.ipScore)"
                :stroke-width="6"
                :show-text="false"
              />
              <span
                class="score-text"
                :style="{ color: getIpScoreColor(row.ipScore) }"
              >
                {{ row.ipScore }}
              </span>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <!-- QoS Level Column -->
        <el-table-column label="QoS等级" width="100">
          <template #default="{ row }">
            <el-rate
              :model-value="row.qosLevel"
              disabled
              :max="5"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            />
            <span class="qos-text">Lv.{{ row.qosLevel }}</span>
          </template>
        </el-table-column>

        <!-- Load Status Column -->
        <el-table-column label="负载状态" width="100">
          <template #default="{ row }">
            <div class="load-status">
              <el-progress
                :percentage="getLoadPercentage(row)"
                :color="getLoadColor(row)"
                :stroke-width="8"
                :show-text="false"
              />
              <span class="load-text" :style="{ color: getLoadColor(row) }">
                {{ getLoadStatusText(row) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="protocol" label="协议" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.protocol.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country" label="地区" width="120">
          <template #default="{ row }">
            {{ row.country }} - {{ row.region }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isEnabled" label="启用" width="70">
          <template #default="{ row }">
            <el-switch v-model="row.isEnabled" @change="(val: boolean) => handleToggleEnable(row, val)" />
          </template>
        </el-table-column>
        <el-table-column prop="currentUsers" label="在线用户" width="100">
          <template #default="{ row }">
            {{ row.currentUsers }} / {{ row.maxUsers }}
          </template>
        </el-table-column>
        <el-table-column prop="trafficUsed" label="已用流量" width="100">
          <template #default="{ row }">
            {{ formatTraffic(row.trafficUsed) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleTest(row)">测试</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="checkIp">
                    <el-icon><Monitor /></el-icon>检测IP
                  </el-dropdown-item>
                  <el-dropdown-item command="refreshScore">
                    <el-icon><Refresh /></el-icon>刷新评分
                  </el-dropdown-item>
                  <el-dropdown-item divided command="delete" class="danger-item">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Node Detail Dialog -->
    <el-dialog v-model="detailVisible" title="节点详情" width="900px">
      <el-descriptions :column="2" border v-if="currentNode">
        <el-descriptions-item label="节点名称">{{ currentNode.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentNode.status)">
            {{ getStatusText(currentNode.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主机">{{ currentNode.host }}</el-descriptions-item>
        <el-descriptions-item label="端口">{{ currentNode.port }}</el-descriptions-item>

        <!-- IP Asset Info -->
        <el-descriptions-item label="IP类型">
          <el-tag :type="getIpTypeTagType(currentNode.ipType)" size="small">
            {{ getIpTypeLabel(currentNode.ipType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="线路类型">
          <el-tag :type="getLineTypeTagType(currentNode.lineType)" size="small">
            {{ getLineTypeLabel(currentNode.lineType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="ISP">{{ currentNode.isp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP评分">
          <span v-if="currentNode.ipScore !== undefined" :style="{ color: getIpScoreColor(currentNode.ipScore) }">
            {{ currentNode.ipScore }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="IPv6支持">
          <el-tag :type="currentNode.supportsIpv6 ? 'success' : 'info'" size="small">
            {{ currentNode.supportsIpv6 ? '支持' : '不支持' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IPv6地址" v-if="currentNode.supportsIpv6">
          {{ currentNode.ipv6Address || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="服务类型">
          <el-tag
            :color="getServiceTypeBgColor(currentNode.serviceType)"
            :style="{ color: getServiceTypeColor(currentNode.serviceType) }"
          >
            {{ getServiceTypeLabel(currentNode.serviceType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="QoS等级">
          <el-rate :model-value="currentNode.qosLevel" disabled :max="5" />
        </el-descriptions-item>
        <el-descriptions-item label="协议">
          <el-tag size="small">{{ currentNode.protocol.toUpperCase() }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="网络">{{ currentNode.network }}</el-descriptions-item>
        <el-descriptions-item label="安全">{{ currentNode.security }}</el-descriptions-item>
        <el-descriptions-item label="地区">{{ currentNode.country }} - {{ currentNode.region }}</el-descriptions-item>
        <el-descriptions-item label="带宽限制">{{ formatTraffic(currentNode.bandwidthLimit) }}/s</el-descriptions-item>
        <el-descriptions-item label="最大用户数">{{ currentNode.maxUsers }}</el-descriptions-item>
        <el-descriptions-item label="当前用户数">{{ currentNode.currentUsers }}</el-descriptions-item>
        <el-descriptions-item label="流量限制">{{ formatTraffic(currentNode.trafficLimit) }}</el-descriptions-item>
        <el-descriptions-item label="已用流量">{{ formatTraffic(currentNode.trafficUsed) }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in currentNode.tags" :key="tag" size="small" style="margin-right: 5px;">
            {{ tag }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentNode.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentNode.updatedAt }}</el-descriptions-item>
      </el-descriptions>

      <!-- IP Pool Info -->
      <template v-if="currentNode?.ipPoolConfig">
        <el-divider content-position="left">IP池配置</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="IP轮换">
            <el-tag :type="currentNode.ipPoolConfig.rotationEnabled ? 'success' : 'info'" size="small">
              {{ currentNode.ipPoolConfig.rotationEnabled ? '已启用' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="轮换间隔" v-if="currentNode.ipPoolConfig.rotationEnabled">
            {{ currentNode.ipPoolConfig.rotationInterval }} 分钟
          </el-descriptions-item>
          <el-descriptions-item label="最小健康IP数">
            {{ currentNode.ipPoolConfig.minHealthyIps }}
          </el-descriptions-item>
          <el-descriptions-item label="最大IP数">
            {{ currentNode.ipPoolConfig.maxIps }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Collection,
  CircleCheck,
  CircleClose,
  User,
  ArrowDown,
  Monitor,
  Refresh,
  Delete,
  OfficeBuilding,
  HomeFilled,
  Iphone,
} from '@element-plus/icons-vue';
import type { Component } from 'vue';
import NodeFilters from '@components/nodes/NodeFilters.vue';
import BatchActions from '@components/nodes/BatchActions.vue';
import {
  getNodes,
  getNodeById,
  deleteNode,
  enableNode,
  disableNode,
  getNodeStats,
  testNodeConnection,
  batchUpdateNodes,
  checkNodeIp,
  refreshNodeIpScore,
} from '@api/nodes';
import type { Node, NodeStats, NodeQuery } from '../../types/node';
import { getIconComponent } from '@utils/icon-map';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  getServiceTypeBgColor,
  getServiceTypeIcon,
} from '@shared/constants/service-type.mjs';
import { IpType, LineType } from '../../types/node';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const nodeList = ref<Node[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const currentNode = ref<Node | null>(null);

const serviceTypes = getAllServiceTypes();

// Stats from API (using actual API response structure)
const stats = reactive({
  total: 0,
  online: 0,
  offline: 0,
  maintenance: 0,
  totalConnections: 0,
});

const serviceTypeStats = reactive<Record<ServiceType, { nodeCount: number; userCount: number }>>({
  [ServiceType.STANDARD]: { nodeCount: 0, userCount: 0 },
  [ServiceType.DEDICATED_LINE]: { nodeCount: 0, userCount: 0 },
  [ServiceType.EXCLUSIVE]: { nodeCount: 0, userCount: 0 },
  [ServiceType.STATIC_RESIDENTIAL]: { nodeCount: 0, userCount: 0 },
});

const queryForm = reactive<NodeQuery & { serviceTypes: ServiceType[]; qosLevel?: number; loadStatus?: string }>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
  protocol: undefined,
  serviceTypes: [],
  qosLevel: undefined,
  loadStatus: undefined,
  // New IP asset filters
  ipType: undefined,
  lineType: undefined,
  isp: undefined,
  minIpScore: undefined,
});

const selectedNodeIds = ref<string[]>([]);



// IP Type helpers
const getIpTypeLabel = (type?: IpType): string => {
  const labels: Record<IpType, string> = {
    [IpType.DATACENTER]: '机房',
    [IpType.DYNAMIC_RESIDENTIAL]: '动态住宅',
    [IpType.STATIC_RESIDENTIAL]: '静态住宅',
    [IpType.MOBILE]: '移动',
  };
  return type ? labels[type] || type : '机房';
};

const getIpTypeTagType = (type?: IpType): string => {
  const types: Record<IpType, string> = {
    [IpType.DATACENTER]: 'info',
    [IpType.DYNAMIC_RESIDENTIAL]: 'success',
    [IpType.STATIC_RESIDENTIAL]: 'warning',
    [IpType.MOBILE]: 'danger',
  };
  return type ? types[type] || 'info' : 'info';
};

const getIpTypeIcon = (type?: IpType): Component => {
  const icons: Record<IpType, Component> = {
    [IpType.DATACENTER]: OfficeBuilding,
    [IpType.DYNAMIC_RESIDENTIAL]: Refresh,
    [IpType.STATIC_RESIDENTIAL]: HomeFilled,
    [IpType.MOBILE]: Iphone,
  };
  return type ? icons[type] || OfficeBuilding : OfficeBuilding;
};

// Line Type helpers
const getLineTypeLabel = (type?: LineType): string => {
  const labels: Record<LineType, string> = {
    [LineType.STANDARD]: '标准',
    [LineType.CN2]: 'CN2',
    [LineType.IEPL]: 'IEPL',
    [LineType.IPLC]: 'IPLC',
  };
  return type ? labels[type] || type : '标准';
};

const getLineTypeTagType = (type?: LineType): string => {
  const types: Record<LineType, string> = {
    [LineType.STANDARD]: 'info',
    [LineType.CN2]: 'success',
    [LineType.IEPL]: 'warning',
    [LineType.IPLC]: 'danger',
  };
  return type ? types[type] || 'info' : 'info';
};

// IP Score helpers
const getIpScoreColor = (score: number): string => {
  if (score >= 70) return '#67c23a'; // Green
  if (score >= 50) return '#e6a23c'; // Yellow
  return '#f56c6c'; // Red
};

const fetchNodes = async () => {
  loading.value = true;
  try {
    const res = await getNodes(queryForm);
    nodeList.value = res.list.map((node: Node) => ({
      ...node,
      serviceType: node.serviceType || ServiceType.STANDARD,
      qosLevel: node.qosLevel || 3,
      bandwidthLimit: node.bandwidthLimit || 100,
      ipType: node.ipType || IpType.DATACENTER,
      lineType: node.lineType || LineType.STANDARD,
    }));
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await getNodeStats();
    // Map API response to stats
    stats.total = res.total || 0;
    stats.online = res.online || 0;
    stats.offline = res.offline || 0;
    stats.maintenance = res.maintenance || 0;
    stats.totalConnections = res.totalConnections || 0;

    // Get service type distribution from API
    const serviceTypeDist = res.serviceTypeDistribution || {};
    serviceTypeStats[ServiceType.STANDARD] = { 
      nodeCount: serviceTypeDist['standard'] || 0, 
      userCount: 0 
    };
    serviceTypeStats[ServiceType.DEDICATED_LINE] = { 
      nodeCount: serviceTypeDist['dedicated_line'] || 0, 
      userCount: 0 
    };
    serviceTypeStats[ServiceType.EXCLUSIVE] = { 
      nodeCount: serviceTypeDist['exclusive'] || 0, 
      userCount: 0 
    };
    serviceTypeStats[ServiceType.STATIC_RESIDENTIAL] = { 
      nodeCount: serviceTypeDist['static_residential'] || 0, 
      userCount: 0 
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    // Use default values
  }
};

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'danger',
    3: 'warning',
  };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '活跃',
    2: '离线',
    3: '维护中',
  };
  return map[status] || '未知';
};

const getLoadPercentage = (row: Node): number => {
  if (row.maxUsers === 0) return 0;
  return Math.round((row.currentUsers / row.maxUsers) * 100);
};

const getLoadColor = (row: Node): string => {
  const percentage = getLoadPercentage(row);
  if (percentage < 30) return '#67c23a';
  if (percentage < 60) return '#e6a23c';
  if (percentage < 80) return '#f56c6c';
  return '#ff0000';
};

const getLoadStatusText = (row: Node): string => {
  const percentage = getLoadPercentage(row);
  if (percentage < 30) return '空闲';
  if (percentage < 60) return '正常';
  if (percentage < 80) return '繁忙';
  return '满载';
};

const formatTraffic = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchNodes();
};

const handleReset = () => {
  queryForm.keyword = '';
  queryForm.status = undefined;
  queryForm.protocol = undefined;
  queryForm.serviceTypes = [];
  queryForm.qosLevel = undefined;
  queryForm.loadStatus = undefined;
  queryForm.ipType = undefined;
  queryForm.lineType = undefined;
  queryForm.isp = undefined;
  queryForm.minIpScore = undefined;
  queryForm.page = 1;
  fetchNodes();
};

const handleCreate = () => {
  router.push('/nodes/create');
};

const handleView = async (row: Node) => {
  try {
    const res = await getNodeById(row.id);
    currentNode.value = res;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取节点详情失败');
  }
};

const handleEdit = (row: Node) => {
  router.push(`/nodes/${row.id}/edit`);
};

const handleToggleEnable = async (row: Node, enabled: boolean) => {
  try {
    if (enabled) {
      await enableNode(row.id);
      ElMessage.success('节点已启用');
    } else {
      await disableNode(row.id);
      ElMessage.success('节点已禁用');
    }
    fetchNodes();
  } catch (error) {
    row.isEnabled = !enabled;
    ElMessage.error('操作失败');
  }
};

const handleTest = async (row: Node) => {
  try {
    const res = await testNodeConnection(row.id);
    if (res.success) {
      ElMessage.success(`连接测试成功，延迟: ${res.latency}ms`);
    } else {
      ElMessage.error('连接测试失败');
    }
  } catch (error) {
    ElMessage.error('连接测试失败');
  }
};

const handleCheckIp = async (row: Node) => {
  try {
    const res = await checkNodeIp(row.id);
    if (res.success) {
      ElMessage.success(`IP检测完成: ${res.ipAddress} (${res.isp}) - 评分: ${res.score}`);
      fetchNodes();
    } else {
      ElMessage.error('IP检测失败');
    }
  } catch (error) {
    ElMessage.error('IP检测失败');
  }
};

const handleRefreshScore = async (row: Node) => {
  try {
    const res = await refreshNodeIpScore(row.id);
    if (res.success) {
      ElMessage.success(`评分已刷新: ${res.oldScore} → ${res.newScore}`);
      fetchNodes();
    } else {
      ElMessage.error('刷新评分失败');
    }
  } catch (error) {
    ElMessage.error('刷新评分失败');
  }
};

const handleDelete = async (row: Node) => {
  try {
    await ElMessageBox.confirm('确定要删除该节点吗？此操作不可恢复。', '警告', {
      type: 'error',
    });
    await deleteNode(row.id);
    ElMessage.success('删除成功');
    fetchNodes();
    fetchStats();
  } catch {
    // Cancelled
  }
};

const handleCommand = (command: string, row: Node) => {
  switch (command) {
    case 'checkIp':
      handleCheckIp(row);
      break;
    case 'refreshScore':
      handleRefreshScore(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
  }
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchNodes();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchNodes();
};

// Batch actions
const handleSelectionChange = (selection: Node[]) => {
  selectedNodeIds.value = selection.map((node) => node.id);
};

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedNodeIds.value = nodeList.value.map((node) => node.id);
  } else {
    selectedNodeIds.value = [];
  }
};

const handleBatchChangeServiceType = async (data: {
  ids: string[];
  serviceType: ServiceType;
  qosLevel?: number;
}) => {
  try {
    await batchUpdateNodes(data.ids, {
      serviceType: data.serviceType,
      ...(data.qosLevel !== undefined && { qosLevel: data.qosLevel }),
    });
    ElMessage.success(`已成功修改 ${data.ids.length} 个节点的服务类型`);
    fetchNodes();
  } catch (error) {
    ElMessage.error('批量修改失败');
  }
};

const handleBatchEnable = async (ids: string[]) => {
  try {
    await batchUpdateNodes(ids, { isEnabled: true });
    ElMessage.success(`已成功启用 ${ids.length} 个节点`);
    fetchNodes();
  } catch (error) {
    ElMessage.error('批量启用失败');
  }
};

const handleBatchDisable = async (ids: string[]) => {
  try {
    await batchUpdateNodes(ids, { isEnabled: false });
    ElMessage.success(`已成功禁用 ${ids.length} 个节点`);
    fetchNodes();
  } catch (error) {
    ElMessage.error('批量禁用失败');
  }
};

const handleBatchDelete = async (ids: string[]) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${ids.length} 个节点吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await batchUpdateNodes(ids, { status: 3 } as Partial<Node>);
    ElMessage.success(`已成功删除 ${ids.length} 个节点`);
    fetchNodes();
    fetchStats();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  }
};

onMounted(() => {
  // Check for service type filter from query
  const serviceTypeFromQuery = route.query.serviceType as ServiceType;
  if (serviceTypeFromQuery && serviceTypes.includes(serviceTypeFromQuery)) {
    queryForm.serviceTypes = [serviceTypeFromQuery];
  }
  fetchNodes();
  fetchStats();
});
</script>

<style scoped lang="scss">
.node-list {
  min-height: calc(100vh - 120px);

  .el-card {
    height: 100%;
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      margin-bottom: 20px;

      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
          }

          .stat-title {
            font-size: 14px;
            color: #909399;
            margin-top: 5px;
          }
        }
      }
    }
  }

  .service-type-stats-row {
    margin-bottom: 20px;

    .service-type-stat-card {
      margin-bottom: 20px;

      .type-stat-content {
        display: flex;
        align-items: center;

        .type-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .type-stat-info {
          .type-name {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .type-count {
            font-size: 13px;
            color: #606266;

            .divider {
              margin: 0 8px;
              color: #dcdfe6;
            }
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .qos-text {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .load-status {
    .load-text {
      font-size: 12px;
      margin-top: 4px;
      display: block;
    }
  }

  .radio-content {
    display: flex;
    align-items: center;
    gap: 6px;

    .type-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }

  .unit-label {
    margin-left: 8px;
    color: #606266;
  }

  .ip-score {
    .score-text {
      font-size: 12px;
      font-weight: 600;
      margin-top: 4px;
      display: block;
    }
  }

  .isp-text {
    font-size: 13px;
    color: #606266;
  }

  .text-muted {
    color: #909399;
    font-size: 13px;
  }

  .danger-item {
    color: #f56c6c;

    &:hover {
      color: #f56c6c;
      background-color: #fef0f0;
    }
  }
}
</style>
