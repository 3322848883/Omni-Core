<template>
  <div class="settings-view">
    <el-row :gutter="20">
      <!-- Settings Menu -->
      <el-col :xs="24" :sm="8" :md="6" :lg="5">
        <el-card class="menu-card">
          <el-menu
            :default-active="activeMenu"
            @select="handleMenuSelect"
            class="settings-menu"
          >
            <el-menu-item index="general">
              <el-icon><Setting /></el-icon>
              <span>基本设置</span>
            </el-menu-item>
            <el-menu-item index="registration">
              <el-icon><User /></el-icon>
              <span>注册设置</span>
            </el-menu-item>
            <el-menu-item index="payment">
              <el-icon><Money /></el-icon>
              <span>支付设置</span>
            </el-menu-item>
            <el-menu-item index="security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
            <el-menu-item index="traffic">
              <el-icon><DataLine /></el-icon>
              <span>流量设置</span>
            </el-menu-item>
            <el-menu-item index="email">
              <el-icon><Message /></el-icon>
              <span>邮件设置</span>
            </el-menu-item>
            <el-menu-item index="other">
              <el-icon><More /></el-icon>
              <span>其他设置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- Settings Content -->
      <el-col :xs="24" :sm="16" :md="18" :lg="19">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>{{ getMenuTitle(activeMenu) }}</span>
              <div class="header-actions">
                <el-button @click="handleReset">重置</el-button>
                <el-button type="primary" @click="handleSave">保存设置</el-button>
              </div>
            </div>
          </template>

          <!-- General Settings -->
          <el-form v-if="activeMenu === 'general'" :model="settings" label-width="150px">
            <el-form-item label="站点名称">
              <el-input v-model="settings.siteName" placeholder="请输入站点名称" />
            </el-form-item>
            <el-form-item label="站点描述">
              <el-input 
                v-model="settings.siteDescription" 
                type="textarea" 
                :rows="3"
                placeholder="请输入站点描述" 
              />
            </el-form-item>
            <el-form-item label="站点Logo">
              <el-input v-model="settings.siteLogo" placeholder="请输入Logo URL" />
            </el-form-item>
            <el-form-item label="站点Favicon">
              <el-input v-model="settings.siteFavicon" placeholder="请输入Favicon URL" />
            </el-form-item>
            <el-form-item label="联系邮箱">
              <el-input v-model="settings.contactEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
            <el-form-item label="支持链接">
              <el-input v-model="settings.supportUrl" placeholder="请输入支持链接" />
            </el-form-item>
          </el-form>

          <!-- Registration Settings -->
          <el-form v-if="activeMenu === 'registration'" :model="settings" label-width="180px">
            <el-form-item label="开放注册">
              <el-switch v-model="settings.registrationEnabled" />
            </el-form-item>
            <el-form-item label="需要邮箱验证">
              <el-switch v-model="settings.emailVerificationRequired" />
            </el-form-item>
            <el-form-item label="默认流量限制(GB)">
              <el-input-number v-model="settings.defaultTrafficLimit" :min="0" :max="10000" />
            </el-form-item>
            <el-form-item label="默认到期天数">
              <el-input-number v-model="settings.defaultExpireDays" :min="1" :max="365" />
            </el-form-item>
          </el-form>

          <!-- Payment Settings -->
          <el-form v-if="activeMenu === 'payment'" :model="settings" label-width="150px">
            <el-form-item label="默认货币">
              <el-select v-model="settings.currency" placeholder="请选择货币">
                <el-option label="CNY (¥)" value="CNY" />
                <el-option label="USD ($)" value="USD" />
                <el-option label="EUR (€)" value="EUR" />
                <el-option label="GBP (£)" value="GBP" />
              </el-select>
            </el-form-item>
            <el-form-item label="支付方式">
              <el-checkbox-group v-model="settings.paymentMethods">
                <el-checkbox label="alipay">支付宝</el-checkbox>
                <el-checkbox label="wechat">微信支付</el-checkbox>
                <el-checkbox label="paypal">PayPal</el-checkbox>
                <el-checkbox label="credit_card">信用卡</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>

          <!-- Security Settings -->
          <el-form v-if="activeMenu === 'security'" :model="settings" label-width="180px">
            <el-form-item label="最大登录尝试次数">
              <el-input-number v-model="settings.maxLoginAttempts" :min="1" :max="10" />
            </el-form-item>
            <el-form-item label="锁定时间(分钟)">
              <el-input-number v-model="settings.lockoutDuration" :min="1" :max="1440" />
            </el-form-item>
            <el-form-item label="密码最小长度">
              <el-input-number v-model="settings.passwordMinLength" :min="6" :max="32" />
            </el-form-item>
            <el-form-item label="要求强密码">
              <el-switch v-model="settings.requireStrongPassword" />
              <span class="form-tip">包含大小写字母、数字和特殊字符</span>
            </el-form-item>
          </el-form>

          <!-- Traffic Settings -->
          <el-form v-if="activeMenu === 'traffic'" :model="settings" label-width="180px">
            <el-form-item label="流量重置日期">
              <el-input-number v-model="settings.trafficResetDay" :min="1" :max="31" />
              <span class="form-tip">每月几号重置流量，1-31</span>
            </el-form-item>
            <el-form-item label="流量预警阈值(%)">
              <el-input-number v-model="settings.trafficAlertThreshold" :min="1" :max="100" />
              <span class="form-tip">当用户使用流量超过此百分比时发送预警</span>
            </el-form-item>
          </el-form>

          <!-- Email Settings -->
          <el-form v-if="activeMenu === 'email'" :model="settings" label-width="150px">
            <el-form-item label="SMTP服务器">
              <el-input v-model="settings.smtpHost" placeholder="如: smtp.gmail.com" />
            </el-form-item>
            <el-form-item label="SMTP端口">
              <el-input-number v-model="settings.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="SMTP用户名">
              <el-input v-model="settings.smtpUser" placeholder="请输入SMTP用户名" />
            </el-form-item>
            <el-form-item label="SMTP密码">
              <el-input v-model="settings.smtpPassword" type="password" placeholder="请输入SMTP密码" show-password />
            </el-form-item>
            <el-form-item label="使用SSL/TLS">
              <el-switch v-model="settings.smtpSecure" />
            </el-form-item>
            <el-form-item label="发件人邮箱">
              <el-input v-model="settings.emailFrom" placeholder="如: noreply@example.com" />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="testEmailLoading"
                :disabled="!settings.emailFrom"
                @click="handleTestEmail"
              >
                发送测试邮件
              </el-button>
              <span class="form-tip" v-if="!settings.emailFrom">请先配置发件人邮箱</span>
            </el-form-item>
          </el-form>

          <!-- Other Settings -->
          <el-form v-if="activeMenu === 'other'" :model="settings" label-width="180px">
            <el-form-item label="维护模式">
              <el-switch v-model="settings.maintenanceMode" />
            </el-form-item>
            <el-form-item label="维护提示信息" v-if="settings.maintenanceMode">
              <el-input 
                v-model="settings.maintenanceMessage" 
                type="textarea" 
                :rows="3"
                placeholder="请输入维护提示信息" 
              />
            </el-form-item>
            <el-form-item label="开启邀请功能">
              <el-switch v-model="settings.allowInvite" />
            </el-form-item>
            <el-form-item label="邀请奖励天数">
              <el-input-number v-model="settings.inviteRewardDays" :min="0" :max="365" />
            </el-form-item>
            <el-form-item label="邀请奖励流量(GB)">
              <el-input-number v-model="settings.inviteRewardTraffic" :min="0" :max="1000" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Setting, User, Money, Lock, DataLine, Message, More } from '@element-plus/icons-vue';
import { getSettings, updateSettings, resetSettings, sendTestEmail } from '@api/settings';
import type { SystemSettings } from '../../types/setting';

const loading = ref(false);
const testEmailLoading = ref(false);
const activeMenu = ref('general');

const settings = reactive<SystemSettings>({
  // General
  siteName: 'FGVPN',
  siteDescription: '高速稳定的VPN服务',
  siteLogo: '',
  siteFavicon: '',
  contactEmail: '',
  supportUrl: '',
  // Registration
  registrationEnabled: true,
  emailVerificationRequired: true,
  defaultTrafficLimit: 100,
  defaultExpireDays: 30,
  // Payment
  currency: 'CNY',
  paymentMethods: ['alipay', 'wechat'],
  // Security
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  passwordMinLength: 8,
  requireStrongPassword: true,
  // Traffic
  trafficResetDay: 1,
  trafficAlertThreshold: 85,
  // Email
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  emailFrom: '',
  // Other
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，请稍后再试',
  allowInvite: true,
  inviteRewardDays: 30,
  inviteRewardTraffic: 100,
});

const menuTitles: Record<string, string> = {
  general: '基本设置',
  registration: '注册设置',
  payment: '支付设置',
  security: '安全设置',
  traffic: '流量设置',
  email: '邮件设置',
  other: '其他设置',
};

const getMenuTitle = (key: string) => menuTitles[key] || '设置';

const handleMenuSelect = (index: string) => {
  activeMenu.value = index;
};

const fetchSettings = async () => {
  loading.value = true;
  try {
    const res = await getSettings();
    Object.assign(settings, res);
  } catch (error) {
    ElMessage.error('获取设置失败');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  try {
    loading.value = true;
    const submitData = {
      ...settings,
      inviteRewardTraffic: settings.inviteRewardTraffic * 1024 * 1024 * 1024,
      defaultTrafficLimit: settings.defaultTrafficLimit * 1024 * 1024 * 1024,
    };
    await updateSettings(submitData);
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
};

const handleReset = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有设置为默认值吗？', '警告', {
      type: 'warning',
    });
    loading.value = true;
    const res = await resetSettings();
    Object.assign(settings, res);
    ElMessage.success('重置成功');
  } catch {
    // Cancelled
  } finally {
    loading.value = false;
  }
};

const handleTestEmail = async () => {
  if (!settings.emailFrom) {
    ElMessage.warning('请先配置发件人邮箱');
    return;
  }

  testEmailLoading.value = true;
  try {
    const response = await sendTestEmail(settings.emailFrom);
    ElMessage.success(response.message || '测试邮件已发送');
  } catch (error: any) {
    ElMessage.error(error?.message || '发送失败，请检查邮件配置');
  } finally {
    testEmailLoading.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});
</script>

<style scoped lang="scss">
.settings-view {
  min-height: calc(100vh - 120px);

  .menu-card {
    margin-bottom: 20px;
    height: 100%;

    .settings-menu {
      border-right: none;
    }
  }

  .el-row {
    height: 100%;
  }

  .el-col {
    height: 100%;
  }

  .el-card {
    height: 100%;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .form-tip {
    margin-left: 10px;
    color: #909399;
    font-size: 12px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>
