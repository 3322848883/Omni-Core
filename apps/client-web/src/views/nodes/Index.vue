<template>
  <div class="nodes-2025">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">节点网络</h1>
        <p class="page-subtitle">探索全球高速节点，选择最优连接</p>
      </div>
      <button class="test-all-btn" @click="testAllNodes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        测试全部延迟
      </button>
    </div>

    <!-- 统计概览 -->
    <div class="overview-grid">
      <div class="overview-card">
        <div class="card-icon online">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.online }}</div>
          <div class="card-label">在线节点</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon countries">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.countries }}</div>
          <div class="card-label">国家/地区</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon latency">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.avgLatency }}ms</div>
          <div class="card-label">平均延迟</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon load">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.avgLoad }}%</div>
          <div class="card-label">平均负载</div>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters-bar">
      <div class="filter-group">
        <span class="filter-label">服务类型</span>
        <div class="filter-options">
          <button
            v-for="type in serviceTypes"
            :key="type.value"
            class="filter-btn"
            :class="{ active: filters.service === type.value }"
            @click="filters.service = filters.service === type.value ? null : type.value"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">协议</span>
        <div class="filter-options">
          <button
            v-for="proto in protocols"
            :key="proto.value"
            class="filter-btn"
            :class="{ active: filters.protocol === proto.value }"
            @click="filters.protocol = filters.protocol === proto.value ? null : proto.value"
          >
            {{ proto.label }}
          </button>
        </div>
      </div>
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索节点、地区..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 活跃筛选标签 -->
    <div class="active-filters" v-if="hasActiveFilters">
      <span class="results-count">{{ filteredNodes.length }} 个节点</span>
      <button class="clear-filters" @click="clearFilters">
        清除筛选
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- 节点列表 -->
    <div class="nodes-container">
      <div class="nodes-grid">
        <div
          v-for="(node, index) in filteredNodes"
          :key="node.id"
          class="node-card"
          :class="{ connected: node.id === connectedNodeId, recommended: node.recommended }"
          :style="{ animationDelay: `${index * 30}ms` }"
        >
          <div class="card-glow"></div>
          
          <div class="node-header">
            <div class="node-flag">{{ node.flag }}</div>
            <div class="node-info">
              <h3 class="node-name">
                {{ node.name }}
                <span v-if="node.recommended" class="recommended-badge">推荐</span>
              </h3>
              <p class="node-location">{{ node.location }}</p>
            </div>
            <div class="node-status" :class="node.status">
              <span class="status-dot"></span>
              {{ node.status === 'online' ? '在线' : '离线' }}
            </div>
          </div>

          <div class="node-metrics">
            <div class="metric-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <div class="metric-content">
                <span class="metric-value" :class="getLatencyClass(node.latency)">{{ node.latency }}ms</span>
                <span class="metric-label">延迟</span>
              </div>
            </div>
            <div class="metric-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              </svg>
              <div class="metric-content">
                <span class="metric-value">{{ node.load }}%</span>
                <span class="metric-label">负载</span>
              </div>
            </div>
            <div class="metric-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
              <div class="metric-content">
                <span class="metric-value">{{ node.protocol }}</span>
                <span class="metric-label">协议</span>
              </div>
            </div>
          </div>

          <div class="node-actions">
            <button class="action-btn test" @click="testNode(node)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              测速
            </button>
            <button class="action-btn connect" @click="connectNode(node)">
              {{ node.id === connectedNodeId ? '断开' : '连接' }}
              <svg v-if="node.id !== connectedNodeId" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredNodes.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="empty-title">未找到节点</h3>
        <p class="empty-text">请尝试调整筛选条件</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载节点中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const loading = ref(true);
const connectedNodeId = ref<string | null>(null);

const filters = ref({
  service: null as string | null,
  protocol: null as string | null,
  search: ''
});

const serviceTypes = [
  { value: 'standard', label: '标准' },
  { value: 'dedicated', label: '专线' },
  { value: 'exclusive', label: '独享' }
];

const protocols = [
  { value: 'vmess', label: 'VMess' },
  { value: 'trojan', label: 'Trojan' },
  { value: 'ss', label: 'Shadowsocks' }
];

const overview = ref({
  online: 156,
  countries: 42,
  avgLatency: 48,
  avgLoad: 35
});

const nodes = ref([
  {
    id: '1',
    name: '东京 - 04',
    location: '日本 · 东京',
    flag: '🇯🇵',
    status: 'online',
    latency: 24,
    load: 28,
    protocol: 'VMess',
    recommended: true
  },
  {
    id: '2',
    name: '首尔 - 02',
    location: '韩国 · 首尔',
    flag: '🇰🇷',
    status: 'online',
    latency: 32,
    load: 45,
    protocol: 'Trojan',
    recommended: false
  },
  {
    id: '3',
    name: '新加坡 - 07',
    location: '新加坡',
    flag: '🇸🇬',
    status: 'online',
    latency: 68,
    load: 62,
    protocol: 'VMess',
    recommended: true
  },
  {
    id: '4',
    name: '洛杉矶 - 12',
    location: '美国 · 洛杉矶',
    flag: '🇺🇸',
    status: 'online',
    latency: 145,
    load: 35,
    protocol: 'Shadowsocks',
    recommended: false
  },
  {
    id: '5',
    name: '伦敦 - 03',
    location: '英国 · 伦敦',
    flag: '🇬🇧',
    status: 'online',
    latency: 198,
    load: 22,
    protocol: 'VMess',
    recommended: false
  },
  {
    id: '6',
    name: '法兰克福 - 05',
    location: '德国 · 法兰克福',
    flag: '🇩🇪',
    status: 'online',
    latency: 186,
    load: 41,
    protocol: 'Trojan',
    recommended: false
  }
]);

const filteredNodes = computed(() => {
  return nodes.value.filter(node => {
    if (filters.value.service && !node.name.toLowerCase().includes(filters.value.service)) {
      return false;
    }
    if (filters.value.protocol && node.protocol.toLowerCase() !== filters.value.protocol) {
      return false;
    }
    if (filters.value.search) {
      const query = filters.value.search.toLowerCase();
      return node.name.toLowerCase().includes(query) ||
             node.location.toLowerCase().includes(query);
    }
    return true;
  });
});

const hasActiveFilters = computed(() => {
  return filters.value.service || filters.value.protocol || filters.value.search;
});

const clearFilters = () => {
  filters.value = {
    service: null,
    protocol: null,
    search: ''
  };
};

const getLatencyClass = (latency: number) => {
  if (latency < 50) return 'excellent';
  if (latency < 100) return 'good';
  if (latency < 200) return 'average';
  return 'poor';
};

const testNode = (node: any) => {
  ElMessage.info(`正在测试 ${node.name}...`);
  setTimeout(() => {
    node.latency = Math.floor(Math.random() * 100) + 20;
    ElMessage.success(`${node.name} 延迟: ${node.latency}ms`);
  }, 1500);
};

const testAllNodes = () => {
  ElMessage.info('开始测试所有节点...');
};

const connectNode = (node: any) => {
  if (connectedNodeId.value === node.id) {
    connectedNodeId.value = null;
    ElMessage.success('已断开连接');
  } else {
    connectedNodeId.value = node.id;
    ElMessage.success(`已连接到 ${node.name}`);
  }
};

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 1500);
});
</script>

<style scoped lang="scss">
.nodes-2025 {
  position: relative;
  z-index: 10;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.header-content {
  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 8px 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: #9CA3AF;
    margin: 0;
  }
}

.test-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  color: #00FFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: rgba(0, 255, 255, 0.2);
    transform: translateY(-2px);
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 255, 255, 0.2);
    transform: translateY(-4px);
  }
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
  }

  &.online {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
    color: #10B981;
  }

  &.countries {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
    color: #3B82F6;
  }

  &.latency {
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.1));
    color: #00FFFF;
  }

  &.load {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1));
    color: #8B5CF6;
  }
}

.card-content {
  .card-value {
    font-size: 28px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.2;
  }

  .card-label {
    font-size: 13px;
    color: #9CA3AF;
  }
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 13px;
  color: #9CA3AF;
  font-weight: 500;
}

.filter-options {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #9CA3AF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #FFFFFF;
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(0, 255, 255, 0.15);
    border-color: rgba(0, 255, 255, 0.4);
    color: #00FFFF;
  }
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #6B7280;
}

.search-input {
  width: 100%;
  height: 42px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0 16px 0 42px;
  color: #E5E7EB;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(0, 255, 255, 0.4);
    background: rgba(0, 255, 255, 0.05);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
  }

  &::placeholder {
    color: #6B7280;
  }
}

.active-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.1);
  border-radius: 10px;
}

.results-count {
  font-size: 14px;
  color: #00FFFF;
  font-weight: 500;
}

.clear-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #9CA3AF;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: #FFFFFF;
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.nodes-container {
  min-height: 400px;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.node-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;

  &:hover {
    border-color: rgba(0, 255, 255, 0.3);
    transform: translateY(-4px);
    background: rgba(0, 255, 255, 0.05);
  }

  &.connected {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.08);
  }

  &.recommended {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #00FFFF, #8B5CF6, #F472B6);
    }
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.node-card:hover .card-glow {
  opacity: 1;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.node-flag {
  font-size: 32px;
  line-height: 1;
}

.node-info {
  flex: 1;
}

.node-name {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommended-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(139, 92, 246, 0.15));
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 10px;
  color: #00FFFF;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-location {
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
}

.node-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  &.online {
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
  }

  &.offline {
    background: rgba(156, 163, 175, 0.15);
    color: #9CA3AF;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.node-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;

  svg {
    width: 16px;
    height: 16px;
    color: #6B7280;
  }
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-value {
  font-size: 15px;
  font-weight: 700;
  color: #FFFFFF;

  &.excellent {
    color: #10B981;
  }

  &.good {
    color: #00FFFF;
  }

  &.average {
    color: #F59E0B;
  }

  &.poor {
    color: #EF4444;
  }
}

.metric-label {
  font-size: 11px;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &.test {
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #8B5CF6;

    &:hover {
      background: rgba(139, 92, 246, 0.25);
      transform: translateY(-2px);
    }
  }

  &.connect {
    background: linear-gradient(135deg, #00FFFF, #8B5CF6);
    border: none;
    color: #000;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
    }
  }
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;

  svg {
    width: 32px;
    height: 32px;
  }
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
}

.empty-text {
  font-size: 14px;
  color: #9CA3AF;
  margin: 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 255, 255, 0.2);
  border-top-color: #00FFFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

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

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .nodes-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .node-metrics {
    flex-wrap: wrap;
  }
}
</style>