<template>
  <div class="node-detail">
    <!-- Header -->
    <el-card class="header-card">
      <div class="header-content">
        <div class="node-title">
          <h2>{{ node?.name }}</h2>
          <div class="node-tags">
            <el-tag
              :color="getServiceTypeBgColor(node?.serviceType || ServiceType.STANDARD)"
              :style="{ color: getServiceTypeColor(node?.serviceType || ServiceType.STANDARD) }"
              effect="plain"
              size="small"
            >
              {{ getServiceTypeLabel(node?.serviceType || ServiceType.STANDARD) }}
            </el-tag>
            <el-tag :type="getStatusType(node?.status || 2)" size="small">
              {{ getStatusText(node?.status || 2) }}
            </el-tag>
            <el-tag v-if="node?.isEnabled" type="success" size="small">已启用</el-tag>
            <el-tag v-else type="info" size="small">已禁用</el-tag>
            <!-- IP Type Tag -->
            <el-tag
              v-if="node?.ipType"
              :type="getIpTypeTagType(node.ipType)"
              size="small"
              effect="light"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="getIpTypeIcon(node.ipType)" />
              </el-icon>
              {{ getIpTypeLabel(node.ipType) }}
            </el-tag>
            <!-- Line Type Tag -->
            <el-tag
              v-if="node?.lineType"
              :type="getLineTypeTagType(node.lineType)"
              size="small"
              effect="plain"
            >
              {{ getLineTypeLabel(node.lineType) }}
            </el-tag>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-button type="primary" @click="handleEdit">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="success" @click="handleTest">
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button type="warning">
              <el-icon><Tools /></el-icon>
              更多操作
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="checkIp">
                  <el-icon><Monitor /></el-icon>检测IP
                </el-dropdown-item>
                <el-dropdown-item command="refreshScore">
                  <el-icon><Refresh /></el-icon>刷新评分
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-card>

    <!-- Tabs -->
    <el-card class="content-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Basic Info Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <div class="tab-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="节点ID">{{ node?.id }}</el-descriptions-item>
              <el-descriptions-item label="节点名称">{{ node?.name }}</el-descriptions-item>
              <el-descriptions-item label="主机">{{ node?.host }}</el-descriptions-item>
              <el-descriptions-item label="端口">{{ node?.port }}</el-descriptions-item>
              <el-descriptions-item label="协议">
                <el-tag size="small">{{ node?.protocol.toUpperCase() }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="网络">{{ node?.network }}</el-descriptions-item>
              <el-descriptions-item label="安全">{{ node?.security }}</el-descriptions-item>
              <el-descriptions-item label="地区">{{ node?.country }} - {{ node?.region }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ node?.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ node?.updatedAt }}</el-descriptions-item>
              <el-descriptions-item label="标签" :span="2">
                <el-tag
                  v-for="tag in node?.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 5px;"
                >
                  {{ tag }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- IP Asset Tab -->
        <el-tab-pane label="IP资产信息" name="ip-asset">
          <div class="tab-content">
            <!-- IP Asset Overview -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="ip-asset-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>IP评分</span>
                      <el-tag
                        v-if="node?.ipReputationStatus"
                        :type="getReputationStatusType(node.ipReputationStatus)"
                        size="small"
                      >
                        {{ getReputationStatusLabel(node.ipReputationStatus) }}
                      </el-tag>
                    </div>
                  </template>
                  <div class="ip-score-display" v-if="node?.ipScore !== undefined">
                    <div
                      class="score-value"
                      :style="{ color: getIpScoreColor(node.ipScore) }"
                    >
                      {{ node.ipScore }}
                    </div>
                    <el-progress
                      :percentage="node.ipScore"
                      :color="getIpScoreColor(node.ipScore)"
                      :stroke-width="12"
                    />
                    <div class="score-label">综合评分 (0-100)</div>
                  </div>
                  <el-empty v-else description="暂无评分数据" />
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="ip-asset-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>IP类型</span>
                    </div>
                  </template>
                  <div class="ip-type-display" v-if="node?.ipType">
                    <el-icon :size="48" :class="getIpTypeIconClass(node.ipType)">
                      <component :is="getIpTypeIcon(node.ipType)" />
                    </el-icon>
                    <div class="type-name">{{ getIpTypeLabel(node.ipType) }}</div>
                    <div class="type-desc">{{ getIpTypeDescription(node.ipType) }}</div>
                  </div>
                  <el-empty v-else description="未配置IP类型" />
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="ip-asset-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>线路质量</span>
                    </div>
                  </template>
                  <div class="line-type-display" v-if="node?.lineType">
                    <div class="line-badge" :class="getLineTypeClass(node.lineType)">
                      {{ getLineTypeLabel(node.lineType) }}
                    </div>
                    <div class="line-priority">
                      优先级: {{ getLinePriority(node.lineType) }}
                    </div>
                    <div class="line-desc">{{ getLineTypeDescription(node.lineType) }}</div>
                  </div>
                  <el-empty v-else description="未配置线路类型" />
                </el-card>
              </el-col>
            </el-row>

            <!-- IP Details -->
            <el-card class="ip-details-card" shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>IP详细信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="IP地址">{{ node?.host || '-' }}</el-descriptions-item>
                <el-descriptions-item label="ISP运营商">{{ node?.isp || '-' }}</el-descriptions-item>
                <el-descriptions-item label="IPv6支持">
                  <el-tag :type="node?.supportsIpv6 ? 'success' : 'info'" size="small">
                    {{ node?.supportsIpv6 ? '支持' : '不支持' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="IPv6地址" v-if="node?.supportsIpv6">
                  {{ node?.ipv6Address || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="黑名单检测">
                  <span v-if="ipAssets.length > 0">
                    <el-tag
                      :type="ipAssets[0].blacklistCount > 0 ? 'danger' : 'success'"
                      size="small"
                    >
                      {{ ipAssets[0].blacklistCount > 0 ? `发现 ${ipAssets[0].blacklistCount} 个黑名单` : '未在黑名单中' }}
                    </el-tag>
                  </span>
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item label="最后检测时间">
                  {{ ipAssets.length > 0 ? ipAssets[0].lastCheckedAt : '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- IP Pool Configuration -->
            <el-card
              v-if="node?.ipPoolConfig && node.ipType === IpType.DYNAMIC_RESIDENTIAL"
              class="ip-pool-card"
              shadow="never"
              style="margin-top: 20px;"
            >
              <template #header>
                <div class="card-header">
                  <span>
                    <el-icon><Refresh /></el-icon>
                    IP池配置
                  </span>
                  <el-tag
                    :type="node.ipPoolConfig.rotationEnabled ? 'success' : 'info'"
                    size="small"
                  >
                    {{ node.ipPoolConfig.rotationEnabled ? '轮换已启用' : '轮换已禁用' }}
                  </el-tag>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="轮换间隔">
                  {{ node.ipPoolConfig.rotationInterval || '-' }} 分钟
                </el-descriptions-item>
                <el-descriptions-item label="最小健康IP数">
                  {{ node.ipPoolConfig.minHealthyIps || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="最大IP数">
                  {{ node.ipPoolConfig.maxIps || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="IP池状态">
                  <el-tag type="success" size="small">正常运行</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- IP Reputation History -->
            <el-card class="reputation-history-card" shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>IP声誉历史</span>
                  <el-button link @click="fetchIpAssets">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </template>
              <el-timeline v-if="reputationHistory.length > 0">
                <el-timeline-item
                  v-for="(record, index) in reputationHistory"
                  :key="index"
                  :type="getHistoryItemType(record.status)"
                  :timestamp="record.timestamp"
                >
                  <div class="history-item">
                    <div class="history-header">
                      <span class="history-source">{{ record.source }}</span>
                      <el-tag
                        :type="getReputationStatusType(record.status)"
                        size="small"
                      >
                        {{ getReputationStatusLabel(record.status) }}
                      </el-tag>
                    </div>
                    <div class="history-score">
                      评分: <span :style="{ color: getIpScoreColor(record.score) }">{{ record.score }}</span>
                    </div>
                    <div v-if="record.details" class="history-details">
                      {{ record.details }}
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无历史记录" />
            </el-card>
          </div>
        </el-tab-pane>

        <!-- Technical Config Tab -->
        <el-tab-pane label="技术配置" name="config">
          <div class="tab-content">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="UUID">{{ nodeConfig.uuid }}</el-descriptions-item>
              <el-descriptions-item label="AlterId">{{ nodeConfig.alterId }}</el-descriptions-item>
              <el-descriptions-item label="加密方式">{{ nodeConfig.encryption }}</el-descriptions-item>
              <el-descriptions-item label="传输协议">{{ nodeConfig.transport }}</el-descriptions-item>
              <el-descriptions-item label="WebSocket路径">{{ nodeConfig.wsPath }}</el-descriptions-item>
              <el-descriptions-item label="TLS设置">
                <el-tag :type="nodeConfig.tlsEnabled ? 'success' : 'info'">
                  {{ nodeConfig.tlsEnabled ? '已启用' : '未启用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="SNI">{{ nodeConfig.sni }}</el-descriptions-item>
              <el-descriptions-item label="允许不安全连接">
                <el-tag :type="nodeConfig.allowInsecure ? 'warning' : 'success'">
                  {{ nodeConfig.allowInsecure ? '允许' : '不允许' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider content-position="left">原始配置</el-divider>
            <el-input
              v-model="rawConfig"
              type="textarea"
              :rows="10"
              readonly
              class="config-textarea"
            />
            <div class="config-actions">
              <el-button type="primary" @click="copyConfig">
                <el-icon><CopyDocument /></el-icon>
                复制配置
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Resource Limits Tab -->
        <el-tab-pane label="资源限制" name="limits">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="limit-card">
                  <template #header>
                    <div class="limit-header">
                      <span>带宽限制</span>
                      <el-tag type="info">{{ formatTraffic(node?.bandwidthLimit || 0) }}/s</el-tag>
                    </div>
                  </template>
                  <div class="limit-chart" ref="bandwidthChartRef"></div>
                  <div class="limit-stats">
                    <div class="stat-row">
                      <span>当前上传:</span>
                      <span class="value">{{ formatTraffic(limits.currentUpload) }}/s</span>
                    </div>
                    <div class="stat-row">
                      <span>当前下载:</span>
                      <span class="value">{{ formatTraffic(limits.currentDownload) }}/s</span>
                    </div>
                    <div class="stat-row">
                      <span>使用率:</span>
                      <el-progress
                        :percentage="limits.bandwidthUsage"
                        :color="getUsageColor(limits.bandwidthUsage)"
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="limit-card">
                  <template #header>
                    <div class="limit-header">
                      <span>流量限制</span>
                      <el-tag type="info">{{ formatTraffic(node?.trafficLimit || 0) }}</el-tag>
                    </div>
                  </template>
                  <div class="limit-chart" ref="trafficChartRef"></div>
                  <div class="limit-stats">
                    <div class="stat-row">
                      <span>已用流量:</span>
                      <span class="value">{{ formatTraffic(node?.trafficUsed || 0) }}</span>
                    </div>
                    <div class="stat-row">
                      <span>剩余流量:</span>
                      <span class="value">{{ formatTraffic((node?.trafficLimit || 0) - (node?.trafficUsed || 0)) }}</span>
                    </div>
                    <div class="stat-row">
                      <span>使用率:</span>
                      <el-progress
                        :percentage="limits.trafficUsage"
                        :color="getUsageColor(limits.trafficUsage)"
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card class="limit-card">
                  <template #header>
                    <div class="limit-header">
                      <span>用户限制</span>
                      <el-tag type="info">{{ node?.maxUsers }} 用户</el-tag>
                    </div>
                  </template>
                  <div class="limit-chart" ref="usersChartRef"></div>
                  <div class="limit-stats">
                    <div class="stat-row">
                      <span>当前在线:</span>
                      <span class="value">{{ node?.currentUsers }} 用户</span>
                    </div>
                    <div class="stat-row">
                      <span>可用容量:</span>
                      <span class="value">{{ (node?.maxUsers || 0) - (node?.currentUsers || 0) }} 用户</span>
                    </div>
                    <div class="stat-row">
                      <span>使用率:</span>
                      <el-progress
                        :percentage="limits.userUsage"
                        :color="getUsageColor(limits.userUsage)"
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="limit-card">
                  <template #header>
                    <div class="limit-header">
                      <span>QoS配置</span>
                      <el-tag type="warning">Lv.{{ node?.qosLevel }}</el-tag>
                    </div>
                  </template>
                  <div class="qos-content">
                    <div class="qos-item">
                      <span class="label">QoS等级:</span>
                      <el-rate :model-value="node?.qosLevel" disabled :max="5" />
                    </div>
                    <div class="qos-item">
                      <span class="label">优先级:</span>
                      <el-slider v-model="qosConfig.priority" :min="1" :max="10" disabled />
                    </div>
                    <div class="qos-item">
                      <span class="label">带宽保证:</span>
                      <span>{{ qosConfig.guaranteedBandwidth }} Mbps</span>
                    </div>
                    <div class="qos-item">
                      <span class="label">延迟要求:</span>
                      <span>&lt; {{ qosConfig.latencyRequirement }} ms</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- Access Control Tab -->
        <el-tab-pane label="访问控制" name="access">
          <div class="tab-content">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>访问权限配置</span>
                  <el-button type="primary" @click="saveAccessConfig">保存配置</el-button>
                </div>
              </template>

              <el-form :model="accessConfig" label-width="120px">
                <el-form-item label="访问模式">
                  <el-radio-group v-model="accessConfig.mode">
                    <el-radio-button label="public">公开访问</el-radio-button>
                    <el-radio-button label="private">私有访问</el-radio-button>
                    <el-radio-button label="whitelist">白名单</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="允许的服务类型">
                  <el-checkbox-group v-model="accessConfig.allowedServiceTypes">
                    <el-checkbox
                      v-for="type in serviceTypes"
                      :key="type"
                      :label="type"
                    >
                      <el-tag
                        :color="getServiceTypeBgColor(type)"
                        :style="{ color: getServiceTypeColor(type) }"
                        size="small"
                      >
                        {{ getServiceTypeLabel(type) }}
                      </el-tag>
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <el-form-item label="最低套餐等级">
                  <el-slider
                    v-model="accessConfig.minPlanLevel"
                    :min="1"
                    :max="5"
                    :step="1"
                    show-stops
                    show-input
                  />
                </el-form-item>

                <el-form-item label="IP白名单" v-if="accessConfig.mode === 'whitelist'">
                  <el-select
                    v-model="accessConfig.whitelistIps"
                    multiple
                    filterable
                    allow-create
                    placeholder="请输入允许的IP地址"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="地区限制">
                  <el-switch v-model="accessConfig.regionRestrictionEnabled" />
                </el-form-item>

                <el-form-item label="允许的地区" v-if="accessConfig.regionRestrictionEnabled">
                  <el-select
                    v-model="accessConfig.allowedRegions"
                    multiple
                    filterable
                    placeholder="选择允许访问的地区"
                    style="width: 100%"
                  >
                    <el-option label="中国大陆" value="CN" />
                    <el-option label="香港" value="HK" />
                    <el-option label="台湾" value="TW" />
                    <el-option label="美国" value="US" />
                    <el-option label="日本" value="JP" />
                    <el-option label="新加坡" value="SG" />
                    <el-option label="欧洲" value="EU" />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>访问日志</span>
                  <el-button link @click="refreshAccessLogs">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </template>
              <el-table :data="accessLogs" stripe>
                <el-table-column prop="timestamp" label="时间" width="180" />
                <el-table-column prop="userId" label="用户ID" width="120" />
                <el-table-column prop="username" label="用户名" width="150" />
                <el-table-column prop="ip" label="IP地址" width="150" />
                <el-table-column prop="action" label="操作" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.action === 'allow' ? 'success' : 'danger'" size="small">
                      {{ row.action === 'allow' ? '允许' : '拒绝' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- Monitoring Tab -->
        <el-tab-pane label="监控统计" name="monitoring">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>实时流量监控</span>
                      <div class="chart-actions">
                        <el-radio-group v-model="trafficTimeRange" size="small">
                          <el-radio-button label="1h">1小时</el-radio-button>
                          <el-radio-button label="6h">6小时</el-radio-button>
                          <el-radio-button label="24h">24小时</el-radio-button>
                          <el-radio-button label="7d">7天</el-radio-button>
                        </el-radio-group>
                      </div>
                    </div>
                  </template>
                  <div ref="trafficMonitorChartRef" class="monitor-chart"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>延迟监控</span>
                    </div>
                  </template>
                  <div ref="latencyChartRef" class="monitor-chart"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>在线用户趋势</span>
                    </div>
                  </template>
                  <div ref="usersTrendChartRef" class="monitor-chart"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>连接质量统计</span>
                    </div>
                  </template>
                  <el-descriptions :column="4" border>
                    <el-descriptions-item label="平均延迟">{{ monitoringStats.avgLatency }} ms</el-descriptions-item>
                    <el-descriptions-item label="丢包率">{{ monitoringStats.packetLoss }}%</el-descriptions-item>
                    <el-descriptions-item label="抖动">{{ monitoringStats.jitter }} ms</el-descriptions-item>
                    <el-descriptions-item label="可用性">{{ monitoringStats.availability }}%</el-descriptions-item>
                    <el-descriptions-item label="总连接数">{{ monitoringStats.totalConnections }}</el-descriptions-item>
                    <el-descriptions-item label="活跃连接">{{ monitoringStats.activeConnections }}</el-descriptions-item>
                    <el-descriptions-item label="峰值连接">{{ monitoringStats.peakConnections }}</el-descriptions-item>
                    <el-descriptions-item label="连接成功率">{{ monitoringStats.connectionSuccessRate }}%</el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  Edit,
  Connection,
  CopyDocument,
  Refresh,
  Tools,
  Monitor,
  OfficeBuilding,
  HomeFilled,
  Iphone,
} from '@element-plus/icons-vue';
import type { Component } from 'vue';
import * as echarts from 'echarts';
import {
  getNodeById,
  testNodeConnection,
  checkNodeIp,
  refreshNodeIpScore,
  getNodeIpAssets,
} from '@api/nodes';
import type { Node, IpAsset, IpReputationHistory } from '../../types/node';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  getServiceTypeBgColor,
} from '@shared/constants/service-type.mjs';
import {
  IpType,
  LineType,
  IpReputationStatus,
} from '../../types/node';

const route = useRoute();
const router = useRouter();

const nodeId = route.params.id as string;
const node = ref<Node | null>(null);
const activeTab = ref('basic');
const serviceTypes = getAllServiceTypes();

// IP Assets
const ipAssets = ref<IpAsset[]>([]);
const reputationHistory = ref<IpReputationHistory[]>([]);

// Charts refs
const bandwidthChartRef = ref<HTMLDivElement>();
const trafficChartRef = ref<HTMLDivElement>();
const usersChartRef = ref<HTMLDivElement>();
const trafficMonitorChartRef = ref<HTMLDivElement>();
const latencyChartRef = ref<HTMLDivElement>();
const usersTrendChartRef = ref<HTMLDivElement>();

let bandwidthChart: echarts.ECharts | null = null;
let trafficChart: echarts.ECharts | null = null;
let usersChart: echarts.ECharts | null = null;
let trafficMonitorChart: echarts.ECharts | null = null;
let latencyChart: echarts.ECharts | null = null;
let usersTrendChart: echarts.ECharts | null = null;

// Node config
const nodeConfig = reactive({
  uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  alterId: 0,
  encryption: 'auto',
  transport: 'tcp',
  wsPath: '/ws',
  tlsEnabled: true,
  sni: 'example.com',
  allowInsecure: false,
});

const rawConfig = ref(JSON.stringify({
  v: '2',
  ps: 'Example Node',
  add: 'example.com',
  port: '443',
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  aid: '0',
  scy: 'auto',
  net: 'tcp',
  type: 'none',
  host: '',
  path: '/ws',
  tls: 'tls',
  sni: 'example.com',
}, null, 2));

// Limits
const limits = reactive({
  currentUpload: 1024 * 1024 * 5, // 5 MB/s
  currentDownload: 1024 * 1024 * 50, // 50 MB/s
  bandwidthUsage: 55,
  trafficUsage: 65,
  userUsage: 42,
});

// QoS config
const qosConfig = reactive({
  priority: 5,
  guaranteedBandwidth: 100,
  latencyRequirement: 50,
});

// Access config
const accessConfig = reactive({
  mode: 'public',
  allowedServiceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
  minPlanLevel: 1,
  whitelistIps: [] as string[],
  regionRestrictionEnabled: false,
  allowedRegions: [] as string[],
});

// Access logs
const accessLogs = ref([
  { timestamp: '2024-01-15 10:30:00', userId: 'U001', username: 'user1', ip: '192.168.1.100', action: 'allow', reason: '正常访问' },
  { timestamp: '2024-01-15 10:25:00', userId: 'U002', username: 'user2', ip: '192.168.1.101', action: 'allow', reason: '正常访问' },
  { timestamp: '2024-01-15 10:20:00', userId: 'U003', username: 'user3', ip: '10.0.0.50', action: 'deny', reason: 'IP不在白名单' },
]);

// Monitoring
const trafficTimeRange = ref('1h');
const monitoringStats = reactive({
  avgLatency: 45,
  packetLoss: 0.1,
  jitter: 3,
  availability: 99.9,
  totalConnections: 1250,
  activeConnections: 45,
  peakConnections: 78,
  connectionSuccessRate: 98.5,
});

// Fetch node data
const fetchNode = async () => {
  try {
    const res = await getNodeById(nodeId);
    node.value = res;
  } catch (error) {
    ElMessage.error('获取节点详情失败');
  }
};

// Fetch IP assets
const fetchIpAssets = async () => {
  try {
    const assets = await getNodeIpAssets(nodeId);
    ipAssets.value = assets;
    // Aggregate history from all assets
    const allHistory: IpReputationHistory[] = [];
    assets.forEach(asset => {
      if (asset.history) {
        allHistory.push(...asset.history);
      }
    });
    // Sort by timestamp desc
    reputationHistory.value = allHistory.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn('Failed to fetch IP assets');
  }
};

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

const getIpTypeDescription = (type?: IpType): string => {
  const descriptions: Record<IpType, string> = {
    [IpType.DATACENTER]: '数据中心IP，稳定性高，适合长期运行',
    [IpType.DYNAMIC_RESIDENTIAL]: '动态轮换住宅IP，匿名性高',
    [IpType.STATIC_RESIDENTIAL]: '固定住宅IP，稳定性与匿名性兼顾',
    [IpType.MOBILE]: '移动网络IP，适合移动端场景',
  };
  return type ? descriptions[type] || '' : '';
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

const getIpTypeIconClass = (type?: IpType): string => {
  const classes: Record<IpType, string> = {
    [IpType.DATACENTER]: 'datacenter',
    [IpType.DYNAMIC_RESIDENTIAL]: 'dynamic',
    [IpType.STATIC_RESIDENTIAL]: 'static',
    [IpType.MOBILE]: 'mobile',
  };
  return type ? classes[type] || '' : '';
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

const getLineTypeDescription = (type?: LineType): string => {
  const descriptions: Record<LineType, string> = {
    [LineType.STANDARD]: '普通国际线路',
    [LineType.CN2]: '中国电信CN2优质线路',
    [LineType.IEPL]: '国际以太网专线',
    [LineType.IPLC]: '国际私人租用线路，最高质量',
  };
  return type ? descriptions[type] || '' : '';
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

const getLineTypeClass = (type?: LineType): string => {
  const classes: Record<LineType, string> = {
    [LineType.STANDARD]: 'standard',
    [LineType.CN2]: 'cn2',
    [LineType.IEPL]: 'iepl',
    [LineType.IPLC]: 'iplc',
  };
  return type ? classes[type] || '' : '';
};

const getLinePriority = (type?: LineType): number => {
  const priorities: Record<LineType, number> = {
    [LineType.STANDARD]: 1,
    [LineType.CN2]: 2,
    [LineType.IEPL]: 3,
    [LineType.IPLC]: 4,
  };
  return type ? priorities[type] || 1 : 1;
};

// IP Score helpers
const getIpScoreColor = (score: number): string => {
  if (score >= 70) return '#67c23a'; // Green
  if (score >= 50) return '#e6a23c'; // Yellow
  return '#f56c6c'; // Red
};

// Reputation Status helpers
const getReputationStatusType = (status: IpReputationStatus): string => {
  const types: Record<IpReputationStatus, string> = {
    [IpReputationStatus.EXCELLENT]: 'success',
    [IpReputationStatus.GOOD]: 'success',
    [IpReputationStatus.FAIR]: 'warning',
    [IpReputationStatus.POOR]: 'danger',
    [IpReputationStatus.BLACKLISTED]: 'danger',
  };
  return types[status] || 'info';
};

const getReputationStatusLabel = (status: IpReputationStatus): string => {
  const labels: Record<IpReputationStatus, string> = {
    [IpReputationStatus.EXCELLENT]: '优秀',
    [IpReputationStatus.GOOD]: '良好',
    [IpReputationStatus.FAIR]: '一般',
    [IpReputationStatus.POOR]: '较差',
    [IpReputationStatus.BLACKLISTED]: '黑名单',
  };
  return labels[status] || status;
};

const getHistoryItemType = (status: IpReputationStatus): string => {
  const types: Record<IpReputationStatus, string> = {
    [IpReputationStatus.EXCELLENT]: 'success',
    [IpReputationStatus.GOOD]: 'success',
    [IpReputationStatus.FAIR]: 'warning',
    [IpReputationStatus.POOR]: 'danger',
    [IpReputationStatus.BLACKLISTED]: 'danger',
  };
  return types[status] || 'primary';
};

// Status helpers
const getStatusType = (status: number) => {
  const map: Record<number, string> = { 1: 'success', 2: 'danger', 3: 'warning' };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 1: '活跃', 2: '离线', 3: '维护中' };
  return map[status] || '未知';
};

const formatTraffic = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const getUsageColor = (percentage: number): string => {
  if (percentage < 50) return '#67c23a';
  if (percentage < 80) return '#e6a23c';
  return '#f56c6c';
};

// Actions
const handleEdit = () => {
  router.push(`/nodes/${nodeId}/edit`);
};

const handleTest = async () => {
  try {
    const res = await testNodeConnection(nodeId);
    if (res.success) {
      ElMessage.success(`连接测试成功，延迟: ${res.latency}ms`);
    } else {
      ElMessage.error('连接测试失败');
    }
  } catch (error) {
    ElMessage.error('连接测试失败');
  }
};

const handleCheckIp = async () => {
  try {
    const res = await checkNodeIp(nodeId);
    if (res.success) {
      ElMessage.success(`IP检测完成: ${res.ipAddress} (${res.isp}) - 评分: ${res.score}`);
      fetchNode();
      fetchIpAssets();
    } else {
      ElMessage.error('IP检测失败');
    }
  } catch (error) {
    ElMessage.error('IP检测失败');
  }
};

const handleRefreshScore = async () => {
  try {
    const res = await refreshNodeIpScore(nodeId);
    if (res.success) {
      ElMessage.success(`评分已刷新: ${res.oldScore} → ${res.newScore}`);
      fetchNode();
      fetchIpAssets();
    } else {
      ElMessage.error('刷新评分失败');
    }
  } catch (error) {
    ElMessage.error('刷新评分失败');
  }
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'checkIp':
      handleCheckIp();
      break;
    case 'refreshScore':
      handleRefreshScore();
      break;
  }
};

const copyConfig = () => {
  navigator.clipboard.writeText(rawConfig.value);
  ElMessage.success('配置已复制到剪贴板');
};

const saveAccessConfig = () => {
  ElMessage.success('访问控制配置已保存');
};

const refreshAccessLogs = () => {
  ElMessage.success('访问日志已刷新');
};

// Initialize charts
const initCharts = () => {
  // Bandwidth gauge
  if (bandwidthChartRef.value) {
    bandwidthChart = echarts.init(bandwidthChartRef.value);
    bandwidthChart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: { color: '#58D9F9' },
        progress: { show: true, width: 18 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { show: false },
        splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
        axisLabel: { distance: 25, color: '#999', fontSize: 12 },
        detail: { valueAnimation: true, formatter: '{value}%', color: '#58D9F9', fontSize: 24, offsetCenter: [0, '70%'] },
        data: [{ value: limits.bandwidthUsage }],
      }],
    });
  }

  // Traffic gauge
  if (trafficChartRef.value) {
    trafficChart = echarts.init(trafficChartRef.value);
    trafficChart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: { color: '#91CC75' },
        progress: { show: true, width: 18 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { show: false },
        splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
        axisLabel: { distance: 25, color: '#999', fontSize: 12 },
        detail: { valueAnimation: true, formatter: '{value}%', color: '#91CC75', fontSize: 24, offsetCenter: [0, '70%'] },
        data: [{ value: limits.trafficUsage }],
      }],
    });
  }

  // Users gauge
  if (usersChartRef.value) {
    usersChart = echarts.init(usersChartRef.value);
    usersChart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: { color: '#FAC858' },
        progress: { show: true, width: 18 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { show: false },
        splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
        axisLabel: { distance: 25, color: '#999', fontSize: 12 },
        detail: { valueAnimation: true, formatter: '{value}%', color: '#FAC858', fontSize: 24, offsetCenter: [0, '70%'] },
        data: [{ value: limits.userUsage }],
      }],
    });
  }

  // Traffic monitor chart
  if (trafficMonitorChartRef.value) {
    trafficMonitorChart = echarts.init(trafficMonitorChartRef.value);
    const timeData = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    trafficMonitorChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['上传', '下载'] },
      xAxis: { type: 'category', data: timeData },
      yAxis: { type: 'value', name: '流量 (MB)' },
      series: [
        { name: '上传', type: 'line', smooth: true, data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)) },
        { name: '下载', type: 'line', smooth: true, data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 500)) },
      ],
    });
  }

  // Latency chart
  if (latencyChartRef.value) {
    latencyChart = echarts.init(latencyChartRef.value);
    latencyChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i * 5}m`) },
      yAxis: { type: 'value', name: '延迟 (ms)' },
      series: [{
        type: 'line',
        smooth: true,
        data: Array.from({ length: 12 }, () => 30 + Math.floor(Math.random() * 40)),
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#5470c6' },
      }],
    });
  }

  // Users trend chart
  if (usersTrendChartRef.value) {
    usersTrendChart = echarts.init(usersTrendChartRef.value);
    usersTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i * 5}m`) },
      yAxis: { type: 'value', name: '用户数' },
      series: [{
        type: 'line',
        smooth: true,
        data: Array.from({ length: 12 }, () => 20 + Math.floor(Math.random() * 30)),
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#91cc75' },
      }],
    });
  }
};

// Watch for tab changes to init charts
watch(activeTab, (tab) => {
  if (tab === 'limits' || tab === 'monitoring') {
    nextTick(() => {
      initCharts();
    });
  }
});

// Lifecycle
onMounted(() => {
  fetchNode();
  fetchIpAssets();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  bandwidthChart?.dispose();
  trafficChart?.dispose();
  usersChart?.dispose();
  trafficMonitorChart?.dispose();
  latencyChart?.dispose();
  usersTrendChart?.dispose();
});

const handleResize = () => {
  bandwidthChart?.resize();
  trafficChart?.resize();
  usersChart?.resize();
  trafficMonitorChart?.resize();
  latencyChart?.resize();
  usersTrendChart?.resize();
};
</script>

<style scoped lang="scss">
.node-detail {
  min-height: calc(100vh - 120px);

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .node-title {
        h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #303133;
        }

        .node-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .content-card {
    .tab-content {
      padding: 20px;
    }
  }

  .config-textarea {
    font-family: monospace;
    font-size: 12px;
  }

  .config-actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
  }

  .limit-card {
    .limit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .limit-chart {
      height: 200px;
      margin-bottom: 16px;
    }

    .limit-stats {
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .value {
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .qos-content {
    .qos-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 100px;
        color: #606266;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .chart-actions {
      display: flex;
      gap: 8px;
    }
  }

  .monitor-chart {
    height: 300px;
  }

  // IP Asset Styles
  .ip-asset-card {
    .ip-score-display {
      text-align: center;
      padding: 20px;

      .score-value {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 16px;
      }

      .score-label {
        margin-top: 12px;
        color: #909399;
        font-size: 14px;
      }
    }

    .ip-type-display {
      text-align: center;
      padding: 20px;

      .el-icon {
        margin-bottom: 12px;

        &.datacenter { color: #409eff; }
        &.dynamic { color: #67c23a; }
        &.static { color: #e6a23c; }
        &.mobile { color: #f56c6c; }
      }

      .type-name {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .type-desc {
        font-size: 13px;
        color: #909399;
      }
    }

    .line-type-display {
      text-align: center;
      padding: 20px;

      .line-badge {
        display: inline-block;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;

        &.standard {
          background-color: #ecf5ff;
          color: #409eff;
        }

        &.cn2 {
          background-color: #f0f9eb;
          color: #67c23a;
        }

        &.iepl {
          background-color: #fdf6ec;
          color: #e6a23c;
        }

        &.iplc {
          background-color: #fef0f0;
          color: #f56c6c;
        }
      }

      .line-priority {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
      }

      .line-desc {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .reputation-history-card {
    .history-item {
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .history-source {
          font-weight: 600;
          color: #303133;
        }
      }

      .history-score {
        font-size: 14px;
        color: #606266;
        margin-bottom: 4px;
      }

      .history-details {
        font-size: 13px;
        color: #909399;
      }
    }
  }
}
</style>
