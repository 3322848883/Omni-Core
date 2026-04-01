<template>
  <div class="invite-page">
    <!-- Invite Info Card -->
    <el-card v-loading="infoLoading" class="invite-info-card">
      <template #header>
        <div class="card-header">
          <span>我的邀请</span>
          <el-button type="primary" @click="showRules = true">查看规则</el-button>
        </div>
      </template>

      <div v-if="inviteInfo" class="invite-content">
        <!-- Invite Code Section -->
        <div class="invite-code-section">
          <div class="section-title">邀请码</div>
          <div class="invite-code-display">
            <span class="code">{{ inviteInfo.inviteCode }}</span>
            <el-button type="primary" link @click="copyCode">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>

        <el-divider />

        <!-- Invite Link Section -->
        <div class="invite-link-section">
          <div class="section-title">邀请链接</div>
          <div class="invite-link-display">
            <el-input v-model="inviteInfo.inviteLink" readonly>
              <template #append>
                <el-button @click="copyLink">
                  <el-icon><CopyDocument /></el-icon>
                  复制链接
                </el-button>
              </template>
            </el-input>
          </div>
        </div>

        <el-divider />

        <!-- QR Code Section -->
        <div class="qr-code-section">
          <div class="section-title">二维码</div>
          <div class="qr-code-display">
            <qrcode-vue :value="inviteInfo.inviteLink" :size="200" level="M" />
            <p class="tip">扫描二维码邀请好友</p>
          </div>
        </div>

        <el-divider />

        <!-- Stats Section -->
        <div class="stats-section">
          <div class="section-title">邀请统计</div>
          <el-row :gutter="20">
            <el-col :xs="12" :sm="8">
              <div class="stat-item">
                <div class="stat-value">{{ inviteInfo.totalInvited }}</div>
                <div class="stat-label">总邀请</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="8">
              <div class="stat-item">
                <div class="stat-value">{{ inviteInfo.registeredCount }}</div>
                <div class="stat-label">已注册</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="8">
              <div class="stat-item">
                <div class="stat-value">{{ inviteInfo.completedCount }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <!-- Rewards Section -->
        <div class="rewards-section">
          <div class="section-title">奖励统计</div>
          <el-row :gutter="20">
            <el-col :xs="12" :sm="8">
              <div class="reward-item">
                <div class="reward-icon traffic">
                  <el-icon><DataLine /></el-icon>
                </div>
                <div class="reward-info">
                  <div class="reward-value">{{ formatTraffic(inviteInfo.totalTrafficReward) }}</div>
                  <div class="reward-label">流量奖励</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="8">
              <div class="reward-item">
                <div class="reward-icon duration">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="reward-info">
                  <div class="reward-value">{{ inviteInfo.totalDurationReward }} 天</div>
                  <div class="reward-label">时长奖励</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="8">
              <div class="reward-item">
                <div class="reward-icon cash">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="reward-info">
                  <div class="reward-value">{{ formatCurrency(inviteInfo.totalCashReward) }}</div>
                  <div class="reward-label">现金奖励</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- Invite Records -->
    <el-card class="records-card" v-loading="recordsLoading">
      <template #header>
        <div class="card-header">
          <span>邀请记录</span>
        </div>
      </template>

      <el-table :data="inviteRecords" stripe style="width: 100%">
        <el-table-column prop="inviteeEmail" label="被邀请人" min-width="180">
          <template #default="{ row }">
            {{ row.inviteeEmail }}
            <el-tag v-if="row.inviteeUsername" size="small" type="info">
              {{ row.inviteeUsername }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inviteChannel" label="邀请渠道" min-width="100" />
        <el-table-column label="注册时间" min-width="160">
          <template #default="{ row }">
            {{ row.registeredAt ? formatDate(row.registeredAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="首单时间" min-width="160">
          <template #default="{ row }">
            {{ row.firstOrderAt ? formatDate(row.firstOrderAt) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Rules Dialog -->
    <el-dialog v-model="showRules" title="邀请规则" width="500px">
      <div class="rules-content">
        <h4>邀请好友，获得丰厚奖励</h4>
        <ul>
          <li>
            <strong>注册奖励：</strong>每成功邀请一位好友注册，您将获得 1GB 流量奖励
          </li>
          <li>
            <strong>首单奖励：</strong>好友完成首单支付，您将获得 30 天时长奖励
          </li>
          <li>
            <strong>现金返利：</strong>好友每次消费，您将获得 10% 现金返利
          </li>
        </ul>
        <div class="rules-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>奖励将在好友完成相应操作后自动发放到您的账户</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { CopyDocument, DataLine, Timer, Money, InfoFilled } from '@element-plus/icons-vue';
import QrcodeVue from 'qrcode.vue';
import useClipboard from 'vue-clipboard3';
import * as inviteApi from '@/api/invite';
import type { InviteInfo, InviteRecord } from '@/types/invite';
import { formatDate, formatTraffic, formatCurrency } from '@/utils/format';

const { toClipboard } = useClipboard();

// Invite Info
const infoLoading = ref(false);
const inviteInfo = ref<InviteInfo | null>(null);

// Invite Records
const recordsLoading = ref(false);
const inviteRecords = ref<InviteRecord[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);

// Dialogs
const showRules = ref(false);

const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    registered: 'success',
    completed: 'success',
  };
  return typeMap[status] || 'info';
};

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    pending: '待注册',
    registered: '已注册',
    completed: '已完成',
  };
  return textMap[status] || status;
};

const fetchInviteInfo = async () => {
  infoLoading.value = true;
  try {
    inviteInfo.value = await inviteApi.getInviteInfo();
  } finally {
    infoLoading.value = false;
  }
};

const fetchInviteRecords = async () => {
  recordsLoading.value = true;
  try {
    const res = await inviteApi.getInviteRecords({
      page: currentPage.value,
      limit: pageSize.value,
    });
    inviteRecords.value = res.items;
    totalRecords.value = res.pagination.total;
  } finally {
    recordsLoading.value = false;
  }
};

const copyCode = async () => {
  if (!inviteInfo.value) return;
  try {
    await toClipboard(inviteInfo.value.inviteCode);
    ElMessage.success('邀请码已复制');
  } catch (e) {
    ElMessage.error('复制失败');
  }
};

const copyLink = async () => {
  if (!inviteInfo.value) return;
  try {
    await toClipboard(inviteInfo.value.inviteLink);
    ElMessage.success('邀请链接已复制');
  } catch (e) {
    ElMessage.error('复制失败');
  }
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchInviteRecords();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchInviteRecords();
};

onMounted(() => {
  fetchInviteInfo();
  fetchInviteRecords();
});
</script>

<style scoped lang="scss">
.invite-page {
  .invite-info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .invite-content {
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }

      .invite-code-section {
        .invite-code-display {
          display: flex;
          align-items: center;
          gap: 16px;

          .code {
            font-size: 32px;
            font-weight: 700;
            color: #409eff;
            letter-spacing: 4px;
            font-family: monospace;
            background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        }
      }

      .invite-link-section {
        .invite-link-display {
          max-width: 500px;
        }
      }

      .qr-code-section {
        .qr-code-display {
          text-align: center;

          .tip {
            color: #909399;
            font-size: 14px;
            margin-top: 12px;
          }
        }
      }

      .stats-section {
        .stat-item {
          text-align: center;
          padding: 16px;
          background-color: #f5f7fa;
          border-radius: 8px;

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #409eff;
            margin-bottom: 4px;
          }

          .stat-label {
            color: #909399;
            font-size: 14px;
          }
        }
      }

      .rewards-section {
        .reward-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background-color: #f5f7fa;
          border-radius: 8px;

          .reward-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;

            .el-icon {
              font-size: 24px;
            }

            &.traffic {
              background-color: #ecf5ff;
              color: #409eff;
            }

            &.duration {
              background-color: #f0f9eb;
              color: #67c23a;
            }

            &.cash {
              background-color: #fdf6ec;
              color: #e6a23c;
            }
          }

          .reward-info {
            .reward-value {
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 2px;
            }

            .reward-label {
              color: #909399;
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .records-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-section {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .rules-content {
    h4 {
      color: #303133;
      margin-bottom: 16px;
    }

    ul {
      padding-left: 20px;
      margin-bottom: 20px;

      li {
        margin-bottom: 12px;
        color: #606266;
        line-height: 1.6;

        strong {
          color: #409eff;
        }
      }
    }

    .rules-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #f5f7fa;
      border-radius: 8px;
      color: #909399;
      font-size: 14px;

      .el-icon {
        color: #e6a23c;
        font-size: 16px;
      }
    }
  }
}
</style>
