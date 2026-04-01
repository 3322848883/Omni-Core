<template>
  <div class="settings-page">
    <el-page-header title="返回个人中心" @back="$router.push('/app/profile')" />

    <!-- Account Settings -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>账户设置</span>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item>
          <template #label>
            <div class="setting-label">
              <el-icon><Message /></el-icon>
              <span>邮件通知</span>
            </div>
          </template>
          <div class="setting-control">
            <el-switch
              v-model="settings.emailNotifications"
              active-text="开启"
              inactive-text="关闭"
              @change="saveSettings"
            />
            <span class="setting-desc">接收订单状态、流量提醒等邮件通知</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="setting-label">
              <el-icon><Bell /></el-icon>
              <span>流量预警</span>
            </div>
          </template>
          <div class="setting-control">
            <el-switch
              v-model="settings.trafficAlert"
              active-text="开启"
              inactive-text="关闭"
              @change="saveSettings"
            />
            <span class="setting-desc">流量使用达到阈值时发送提醒</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="setting-label">
              <el-icon><Warning /></el-icon>
              <span>预警阈值</span>
            </div>
          </template>
          <div class="setting-control">
            <el-slider
              v-model="settings.alertThreshold"
              :max="100"
              :step="10"
              show-stops
              :disabled="!settings.trafficAlert"
              @change="saveSettings"
            />
            <span class="threshold-value">{{ settings.alertThreshold }}%</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="setting-label">
              <el-icon><Lock /></el-icon>
              <span>登录提醒</span>
            </div>
          </template>
          <div class="setting-control">
            <el-switch
              v-model="settings.loginAlert"
              active-text="开启"
              inactive-text="关闭"
              @change="saveSettings"
            />
            <span class="setting-desc">新设备登录时发送提醒</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="setting-label">
              <el-icon><Moon /></el-icon>
              <span>深色模式</span>
            </div>
          </template>
          <div class="setting-control">
            <el-switch
              v-model="settings.darkMode"
              active-text="开启"
              inactive-text="关闭"
              @change="toggleDarkMode"
            />
            <span class="setting-desc">切换深色/浅色主题</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="setting-label">
              <el-icon><Connection /></el-icon>
              <span>语言设置</span>
            </div>
          </template>
          <div class="setting-control">
            <el-select v-model="settings.language" @change="saveSettings">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Security Settings -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>安全设置</span>
        </div>
      </template>

      <div class="security-list">
        <div class="security-item">
          <div class="security-info">
            <div class="security-title">
              <el-icon><Key /></el-icon>
              <span>修改密码</span>
            </div>
            <div class="security-desc">定期更换密码可以保护账户安全</div>
          </div>
          <el-button type="primary" link @click="$router.push('/profile')">
            去修改
          </el-button>
        </div>

        <el-divider />

        <div class="security-item">
          <div class="security-info">
            <div class="security-title">
              <el-icon><Iphone /></el-icon>
              <span>两步验证</span>
            </div>
            <div class="security-desc">开启两步验证，提高账户安全性</div>
          </div>
          <el-switch
            v-model="settings.twoFactorAuth"
            @change="handleTwoFactorChange"
          />
        </div>

        <el-divider />

        <div class="security-item">
          <div class="security-info">
            <div class="security-title">
              <el-icon><Connection /></el-icon>
              <span>登录设备管理</span>
            </div>
            <div class="security-desc">查看和管理已登录的设备</div>
          </div>
          <el-button type="primary" link @click="showDevices = true">
            查看
          </el-button>
        </div>

        <el-divider />

        <div class="security-item">
          <div class="security-info">
            <div class="security-title">
              <el-icon><Delete /></el-icon>
              <span>注销账户</span>
            </div>
            <div class="security-desc">永久删除账户和所有数据</div>
          </div>
          <el-button type="danger" link @click="handleDeleteAccount">
            注销
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- About -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>关于</span>
        </div>
      </template>

      <div class="about-content">
        <div class="about-item">
          <span class="about-label">版本</span>
          <span class="about-value">v1.0.0</span>
        </div>
        <div class="about-item">
          <span class="about-label">官网</span>
          <el-link type="primary" href="https://fgvpn.com" target="_blank">
            https://fgvpn.com
          </el-link>
        </div>
        <div class="about-item">
          <span class="about-label">客服邮箱</span>
          <el-link type="primary" href="mailto:support@fgvpn.com">
            support@fgvpn.com
          </el-link>
        </div>
      </div>
    </el-card>

    <!-- Devices Dialog -->
    <el-dialog v-model="showDevices" title="登录设备" width="600px">
      <el-table :data="devices" stripe>
        <el-table-column prop="deviceName" label="设备名称" min-width="150" />
        <el-table-column prop="deviceType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.deviceType === 'mobile' ? 'success' : 'info'">
              {{ row.deviceType === 'mobile' ? '手机' : '电脑' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastActive" label="最后活跃" min-width="150">
          <template #default="{ row }">
            {{ formatDate(row.lastActive) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="!row.isCurrent"
              type="danger"
              link
              size="small"
              @click="logoutDevice(row)"
            >
              退出
            </el-button>
            <el-tag v-else size="small" type="success">当前设备</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- Two Factor Dialog -->
    <el-dialog v-model="showTwoFactor" title="开启两步验证" width="400px">
      <div class="two-factor-content">
        <p>请使用身份验证器扫描下方二维码</p>
        <div class="qr-code">
          <qrcode-vue value="otpauth://totp/FGVPN:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=FGVPN" :size="200" level="M" />
        </div>
        <el-input v-model="twoFactorCode" placeholder="请输入6位验证码" maxlength="6">
          <template #append>
            <el-button @click="verifyTwoFactor">验证</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Message,
  Bell,
  Warning,
  Lock,
  Moon,
  Key,
  Iphone,
  Connection,
  Delete,
} from '@element-plus/icons-vue';
import QrcodeVue from 'qrcode.vue';
import { formatDate } from '@/utils/format';
import * as userApi from '@/api/user';

// Settings
const settings = reactive({
  emailNotifications: true,
  trafficAlert: true,
  alertThreshold: 80,
  loginAlert: true,
  darkMode: false,
  language: 'zh-CN',
  twoFactorAuth: false,
});

// Dialogs
const showDevices = ref(false);
const showTwoFactor = ref(false);
const twoFactorCode = ref('');

// Mock devices data
const devices = ref([
  {
    deviceId: '1',
    deviceName: 'Windows Chrome',
    deviceType: 'desktop',
    lastActive: new Date().toISOString(),
    isCurrent: true,
  },
  {
    deviceId: '2',
    deviceName: 'iPhone Safari',
    deviceType: 'mobile',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    isCurrent: false,
  },
]);

const saveSettings = async () => {
  try {
    await userApi.updateUser({
      settings: {
        emailNotifications: settings.emailNotifications,
        trafficAlert: settings.trafficAlert,
        alertThreshold: settings.alertThreshold,
        loginAlert: settings.loginAlert,
        language: settings.language,
      }
    });
    ElMessage.success('设置已保存');
  } catch (error) {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    ElMessage.success('设置已本地保存');
  }
};

const toggleDarkMode = () => {
  const html = document.documentElement;
  if (settings.darkMode) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  saveSettings();
};

const handleTwoFactorChange = (value: boolean) => {
  if (value) {
    settings.twoFactorAuth = false;
    showTwoFactor.value = true;
  } else {
    ElMessageBox.confirm('确定要关闭两步验证吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        settings.twoFactorAuth = false;
        ElMessage.success('两步验证已关闭');
      })
      .catch(() => {
        settings.twoFactorAuth = true;
      });
  }
};

const verifyTwoFactor = async () => {
  if (twoFactorCode.value.length !== 6) {
    ElMessage.error('请输入6位验证码');
    return;
  }
  try {
    await userApi.verifyTwoFactor(twoFactorCode.value);
    settings.twoFactorAuth = true;
    showTwoFactor.value = false;
    twoFactorCode.value = '';
    ElMessage.success('两步验证已开启');
  } catch (error) {
    ElMessage.error('验证码验证失败，请重试');
  }
};

const logoutDevice = (device: typeof devices.value[0]) => {
  ElMessageBox.confirm(`确定要退出设备 "${device.deviceName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      devices.value = devices.value.filter((d) => d.deviceId !== device.deviceId);
      ElMessage.success('设备已退出');
    })
    .catch(() => {});
};

const handleDeleteAccount = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要注销账户吗？此操作不可恢复，所有数据将被永久删除。',
      '危险操作',
      {
        confirmButtonText: '确定注销',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
      }
    );
  } catch {
    return;
  }

  try {
    await ElMessageBox.prompt('请输入 "DELETE" 确认注销', '确认注销', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputValidator: (value) => value === 'DELETE',
      inputErrorMessage: '输入不正确',
    });
  } catch {
    return;
  }

  try {
    await userApi.deleteAccount('DELETE');
    ElMessage.success('账户已注销');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  } catch (error) {
    ElMessage.error('账户注销失败，请稍后重试');
  }
};

onMounted(() => {
  // Load settings from localStorage
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings));
  }

  // Apply dark mode
  if (settings.darkMode) {
    document.documentElement.classList.add('dark');
  }
});
</script>

<style scoped lang="scss">
.settings-page {
  .settings-card {
    margin-top: 20px;
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        font-size: 16px;
        color: #409eff;
      }
    }

    .setting-control {
      display: flex;
      align-items: center;
      gap: 16px;

      .setting-desc {
        color: #909399;
        font-size: 14px;
      }

      .threshold-value {
        font-weight: 600;
        color: #409eff;
        min-width: 40px;
      }

      .el-slider {
        width: 200px;
      }
    }

    .security-list {
      .security-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;

        .security-info {
          .security-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 4px;

            .el-icon {
              color: #409eff;
            }
          }

          .security-desc {
            color: #909399;
            font-size: 14px;
          }
        }
      }
    }

    .about-content {
      .about-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .about-label {
          color: #909399;
          font-size: 14px;
        }

        .about-value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }

  .two-factor-content {
    text-align: center;

    p {
      color: #606266;
      margin-bottom: 20px;
    }

    .qr-code {
      margin-bottom: 20px;
    }

    .el-input {
      max-width: 300px;
      margin: 0 auto;
    }
  }
}
</style>
