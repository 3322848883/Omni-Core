<template>
  <div class="dashboard-2025">
    <!-- 主要状态卡片 -->
    <div class="hero-section">
      <div class="status-card main-status">
        <div class="status-glow"></div>
        <div class="status-content">
          <div class="connection-indicator">
            <div class="pulse-ring"></div>
            <div class="pulse-ring"></div>
            <div class="pulse-ring"></div>
            <div class="status-dot"></div>
          </div>
          <div class="status-text">
            <h2 class="status-title">连接正常</h2>
            <p class="status-subtitle">当前节点：东京 - 04</p>
          </div>
        </div>
        <div class="status-metrics">
          <div class="metric-item">
            <span class="metric-label">延迟</span>
            <span class="metric-value">24ms</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">下载</span>
            <span class="metric-value">85.2 MB/s</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">上传</span>
            <span class="metric-value">42.8 MB/s</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="stats-grid">
      <div class="stat-card traffic">
        <div class="card-header">
          <div class="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
          <span class="card-label">流量使用</span>
        </div>
        <div class="card-content">
          <div class="traffic-display">
            <span class="used">64.2 GB</span>
            <span class="separator">/</span>
            <span class="total">200 GB</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 32%"></div>
          </div>
          <div class="progress-label">32% 已使用</div>
        </div>
      </div>

      <div class="stat-card subscription">
        <div class="card-header">
          <div class="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
          </div>
          <span class="card-label">套餐信息</span>
        </div>
        <div class="card-content">
          <div class="plan-name">专业版 - 年度</div>
          <div class="expiry-count">
            <span class="days">342</span>
            <span class="days-label">天剩余</span>
          </div>
          <div class="expiry-date">到期：2026年03月12日</div>
        </div>
      </div>

      <div class="stat-card nodes">
        <div class="card-header">
          <div class="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="5" cy="12" r="3"/>
              <circle cx="19" cy="12" r="3"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <circle cx="12" cy="5" r="3"/>
              <line x1="12" y1="8" x2="12" y2="9"/>
              <circle cx="12" cy="19" r="3"/>
              <line x1="12" y1="15" x2="12" y2="16"/>
            </svg>
          </div>
          <span class="card-label">节点状态</span>
        </div>
        <div class="card-content">
          <div class="node-counts">
            <div class="count-item">
              <span class="count-value">156</span>
              <span class="count-label">在线节点</span>
            </div>
            <div class="count-item">
              <span class="count-value">42</span>
              <span class="count-label">国家/地区</span>
            </div>
          </div>
          <button class="view-nodes-btn" @click="$router.push('/app/nodes')">
            查看全部节点
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="stat-card invite">
        <div class="card-header">
          <div class="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span class="card-label">邀请奖励</span>
        </div>
        <div class="card-content">
          <div class="invite-stats">
            <div class="stat-row">
              <span class="stat-row-label">已邀请</span>
              <span class="stat-row-value">12 人</span>
            </div>
            <div class="stat-row">
              <span class="stat-row-label">本月奖励</span>
              <span class="stat-row-value reward">+150 GB</span>
            </div>
          </div>
          <button class="invite-btn" @click="$router.push('/app/invite')">
            邀请好友
          </button>
        </div>
      </div>
    </div>

    <!-- 实时图表区域 -->
    <div class="charts-section">
      <div class="chart-card speed-chart">
        <div class="chart-header">
          <h3 class="chart-title">实时网速</h3>
          <div class="chart-actions">
            <button class="time-btn active">1小时</button>
            <button class="time-btn">24小时</button>
            <button class="time-btn">7天</button>
          </div>
        </div>
        <div class="chart-container">
          <div class="speed-legend">
            <div class="legend-item">
              <span class="legend-dot download"></span>
              <span>下载</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot upload"></span>
              <span>上传</span>
            </div>
          </div>
          <div class="speed-graph">
            <div class="graph-bg">
              <div class="grid-line" v-for="i in 5" :key="i"></div>
            </div>
            <div class="graph-bars">
              <div
                v-for="(bar, index) in speedData"
                :key="index"
                class="bar-pair"
              >
                <div class="bar download" :style="{ height: bar.download + '%' }"></div>
                <div class="bar upload" :style="{ height: bar.upload + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card activity-feed">
        <div class="chart-header">
          <h3 class="chart-title">最近活动</h3>
          <button class="view-all-btn">查看全部</button>
        </div>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-title">成功连接到东京节点</div>
              <div class="activity-time">3分钟前</div>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-title">套餐自动续费成功</div>
              <div class="activity-time">2小时前</div>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon reward">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-title">获得邀请奖励 50GB</div>
              <div class="activity-time">昨天 18:42</div>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-title">流量使用已达30%</div>
              <div class="activity-time">3天前</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="actions-section">
      <h3 class="section-title">快捷操作</h3>
      <div class="actions-grid">
        <button class="action-card" @click="$router.push('/app/nodes')">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="5" cy="12" r="3"/>
              <circle cx="19" cy="12" r="3"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <circle cx="12" cy="5" r="3"/>
              <circle cx="12" cy="19" r="3"/>
            </svg>
          </div>
          <span class="action-label">切换节点</span>
        </button>
        <button class="action-card" @click="$router.push('/app/subscription')">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <span class="action-label">升级套餐</span>
        </button>
        <button class="action-card" @click="showQRCode">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <span class="action-label">订阅二维码</span>
        </button>
        <button class="action-card" @click="runSpeedTest">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span class="action-label">测速</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const speedData = ref([
  { download: 78, upload: 45 },
  { download: 85, upload: 52 },
  { download: 62, upload: 38 },
  { download: 91, upload: 58 },
  { download: 75, upload: 42 },
  { download: 88, upload: 55 },
  { download: 72, upload: 48 },
  { download: 95, upload: 62 },
  { download: 68, upload: 40 },
  { download: 82, upload: 50 },
  { download: 76, upload: 46 },
  { download: 89, upload: 54 }
]);

const showQRCode = () => {
  ElMessage.info('订阅二维码功能即将推出');
};

const runSpeedTest = () => {
  ElMessage.success('开始测速...');
};
</script>

<style scoped lang="scss">
.dashboard-2025 {
  position: relative;
  z-index: 10;
}

// Hero 区域
.hero-section {
  margin-bottom: 32px;
}

.status-card {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 24px;
  padding: 32px;
  position: relative;
  overflow: hidden;
}

.status-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%);
  animation: glow-rotate 10s linear infinite;
}

@keyframes glow-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-content {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.connection-indicator {
  position: relative;
  width: 80px;
  height: 80px;
}

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse-expand 2s ease-out infinite;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.5s;
}

.pulse-ring:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse-expand {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.status-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: #10B981;
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
}

.status-title {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 4px 0;
}

.status-subtitle {
  font-size: 14px;
  color: #9CA3AF;
  margin: 0;
}

.status-metrics {
  display: flex;
  gap: 48px;
  position: relative;
  z-index: 1;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #00FFFF;
  font-family: 'SF Mono', monospace;
}

// 统计卡片网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 255, 255, 0.3);
    transform: translateY(-4px);
    background: rgba(0, 255, 255, 0.05);
  }

  &.traffic:hover {
    border-color: rgba(0, 255, 255, 0.3);
  }

  &.subscription:hover {
    border-color: rgba(139, 92, 246, 0.3);
  }

  &.nodes:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  &.invite:hover {
    border-color: rgba(245, 158, 11, 0.3);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.icon-container {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
  }
}

.stat-card.traffic .icon-container {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.1));
  color: #00FFFF;
}

.stat-card.subscription .icon-container {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1));
  color: #8B5CF6;
}

.stat-card.nodes .icon-container {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
  color: #10B981;
}

.stat-card.invite .icon-container {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
  color: #F59E0B;
}

.card-label {
  font-size: 13px;
  color: #9CA3AF;
  font-weight: 500;
}

.traffic-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.used {
  font-size: 32px;
  font-weight: 700;
  color: #00FFFF;
}

.separator {
  color: #4B5563;
  font-size: 20px;
}

.total {
  font-size: 20px;
  font-weight: 600;
  color: #6B7280;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00FFFF, #8B5CF6);
  border-radius: 4px;
  transition: width 1s ease;
}

.progress-label {
  font-size: 12px;
  color: #6B7280;
}

.plan-name {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 12px;
}

.expiry-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.days {
  font-size: 36px;
  font-weight: 700;
  color: #8B5CF6;
}

.days-label {
  font-size: 14px;
  color: #6B7280;
}

.expiry-date {
  font-size: 13px;
  color: #9CA3AF;
}

.node-counts {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.count-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.count-value {
  font-size: 28px;
  font-weight: 700;
  color: #10B981;
}

.count-label {
  font-size: 12px;
  color: #6B7280;
}

.view-nodes-btn {
  width: 100%;
  padding: 10px 16px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  color: #10B981;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba(16, 185, 129, 0.2);
    transform: translateY(-2px);
  }
}

.invite-stats {
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.stat-row-label {
  font-size: 13px;
  color: #9CA3AF;
}

.stat-row-value {
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;

  &.reward {
    color: #F59E0B;
  }
}

.invite-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  }
}

// 图表区域
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.time-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #9CA3AF;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #FFFFFF;
    border-color: rgba(0, 255, 255, 0.3);
  }

  &.active {
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(139, 92, 246, 0.15));
    border-color: rgba(0, 255, 255, 0.4);
    color: #00FFFF;
  }
}

.view-all-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9CA3AF;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #FFFFFF;
    border-color: rgba(0, 255, 255, 0.3);
  }
}

.speed-legend {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9CA3AF;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.download {
    background: linear-gradient(180deg, #00FFFF, #8B5CF6);
  }

  &.upload {
    background: linear-gradient(180deg, #F472B6, #EC4899);
  }
}

.speed-graph {
  height: 200px;
  position: relative;
}

.graph-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.graph-bars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 0 20px;
}

.bar-pair {
  display: flex;
  gap: 4px;
  align-items: flex-end;
}

.bar {
  width: 12px;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;

  &.download {
    background: linear-gradient(180deg, #00FFFF, #8B5CF6);
  }

  &.upload {
    background: linear-gradient(180deg, #F472B6, #EC4899);
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }

  &.success {
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
  }

  &.info {
    background: rgba(59, 130, 246, 0.15);
    color: #3B82F6;
  }

  &.reward {
    background: rgba(245, 158, 11, 0.15);
    color: #F59E0B;
  }

  &.warning {
    background: rgba(239, 68, 68, 0.15);
    color: #EF4444;
  }
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #E5E7EB;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #6B7280;
}

// 快捷操作
.actions-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.05);
    border-color: rgba(0, 255, 255, 0.3);
    transform: translateY(-4px);

    .action-icon {
      transform: scale(1.1);
    }
  }
}

.action-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(139, 92, 246, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00FFFF;
  transition: transform 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
  }
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: #E5E7EB;
}

// 响应式
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .status-card {
    padding: 20px;
  }

  .status-content {
    flex-direction: column;
    text-align: center;
  }

  .status-metrics {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>