<template>
  <div class="payment-config">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>支付配置</span>
          <div class="header-actions">
            <el-button type="success" :icon="Connection" @click="handleTest">测试连接</el-button>
            <el-button type="primary" :icon="Check" @click="handleSave">保存配置</el-button>
          </div>
        </div>
      </template>

      <!-- 支付方式启用/禁用开关 -->
      <div class="payment-methods-section">
        <h3 class="section-title">支付方式管理</h3>
        <div class="payment-methods-grid">
          <div
            v-for="method in paymentMethods"
            :key="method.key"
            class="payment-method-card"
            :class="{ enabled: formData[method.key].enabled }"
          >
            <div class="method-icon">
              <el-icon :size="32" :color="method.color">
                <component :is="method.icon" />
              </el-icon>
            </div>
            <div class="method-info">
              <span class="method-name">{{ method.name }}</span>
              <el-switch
                v-model="formData[method.key].enabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </div>
          </div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        label-width="140px"
        class="config-form"
      >
        <!-- 支付宝配置 -->
        <template v-if="formData.alipay.enabled">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="18" color="#1677FF"><Wallet /></el-icon>
              支付宝配置
            </span>
          </el-divider>

          <el-form-item label="App ID" prop="alipay.appId">
            <el-input v-model="formData.alipay.appId" placeholder="请输入支付宝App ID" />
          </el-form-item>

          <el-form-item label="私钥" prop="alipay.privateKey">
            <el-input
              v-model="formData.alipay.privateKey"
              type="textarea"
              :rows="4"
              placeholder="请输入支付宝私钥"
              show-password
            />
          </el-form-item>

          <el-form-item label="公钥" prop="alipay.publicKey">
            <el-input
              v-model="formData.alipay.publicKey"
              type="textarea"
              :rows="4"
              placeholder="请输入支付宝公钥"
            />
          </el-form-item>

          <el-form-item label="支付宝公钥" prop="alipay.alipayPublicKey">
            <el-input
              v-model="formData.alipay.alipayPublicKey"
              type="textarea"
              :rows="4"
              placeholder="请输入支付宝公钥（用于验签）"
            />
          </el-form-item>

          <el-form-item label="网关地址" prop="alipay.gateway">
            <el-input v-model="formData.alipay.gateway" placeholder="https://openapi.alipay.com/gateway.do" />
          </el-form-item>

          <el-form-item label="回调地址" prop="alipay.notifyUrl">
            <el-input v-model="formData.alipay.notifyUrl" placeholder="https://your-domain.com/api/payment/alipay/notify" />
          </el-form-item>

          <el-form-item label="返回地址" prop="alipay.returnUrl">
            <el-input v-model="formData.alipay.returnUrl" placeholder="https://your-domain.com/payment/success" />
          </el-form-item>

          <el-form-item label="签名类型" prop="alipay.signType">
            <el-select v-model="formData.alipay.signType" placeholder="请选择签名类型" style="width: 100%">
              <el-option label="RSA2 (推荐)" value="RSA2" />
              <el-option label="RSA" value="RSA" />
            </el-select>
          </el-form-item>

          <el-form-item label="字符编码" prop="alipay.charset">
            <el-input v-model="formData.alipay.charset" placeholder="utf-8" />
          </el-form-item>
        </template>

        <!-- 微信支付配置 -->
        <template v-if="formData.wechat.enabled">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="18" color="#07C160"><ChatDotRound /></el-icon>
              微信支付配置
            </span>
          </el-divider>

          <el-form-item label="App ID" prop="wechat.appId">
            <el-input v-model="formData.wechat.appId" placeholder="请输入微信App ID" />
          </el-form-item>

          <el-form-item label="商户号" prop="wechat.mchId">
            <el-input v-model="formData.wechat.mchId" placeholder="请输入微信商户号" />
          </el-form-item>

          <el-form-item label="API密钥" prop="wechat.apiKey">
            <el-input
              v-model="formData.wechat.apiKey"
              placeholder="请输入微信API密钥"
              show-password
            />
          </el-form-item>

          <el-form-item label="API密钥V3" prop="wechat.apiKeyV3">
            <el-input
              v-model="formData.wechat.apiKeyV3"
              placeholder="请输入微信API密钥V3（可选）"
              show-password
            />
          </el-form-item>

          <el-form-item label="证书路径" prop="wechat.certPath">
            <el-input v-model="formData.wechat.certPath" placeholder="请输入证书文件路径，如：/path/to/apiclient_cert.pem" />
          </el-form-item>

          <el-form-item label="密钥路径" prop="wechat.keyPath">
            <el-input v-model="formData.wechat.keyPath" placeholder="请输入密钥文件路径，如：/path/to/apiclient_key.pem" />
          </el-form-item>

          <el-form-item label="回调地址" prop="wechat.notifyUrl">
            <el-input v-model="formData.wechat.notifyUrl" placeholder="https://your-domain.com/api/payment/wechat/notify" />
          </el-form-item>

          <el-form-item label="返回地址" prop="wechat.returnUrl">
            <el-input v-model="formData.wechat.returnUrl" placeholder="https://your-domain.com/payment/success" />
          </el-form-item>

          <el-form-item label="交易方式" prop="wechat.tradeType">
            <el-select v-model="formData.wechat.tradeType" placeholder="请选择交易方式" style="width: 100%">
              <el-option label="JSAPI - 公众号支付" value="JSAPI" />
              <el-option label="NATIVE - 扫码支付" value="NATIVE" />
              <el-option label="APP - APP支付" value="APP" />
              <el-option label="H5 - H5支付" value="H5" />
              <el-option label="MINIPROGRAM - 小程序支付" value="MINIPROGRAM" />
            </el-select>
          </el-form-item>
        </template>

        <!-- PayPal配置 -->
        <template v-if="formData.paypal.enabled">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="18" color="#003087"><CreditCard /></el-icon>
              PayPal配置
            </span>
          </el-divider>

          <el-form-item label="Client ID" prop="paypal.clientId">
            <el-input v-model="formData.paypal.clientId" placeholder="请输入PayPal Client ID" />
          </el-form-item>

          <el-form-item label="Client Secret" prop="paypal.clientSecret">
            <el-input
              v-model="formData.paypal.clientSecret"
              placeholder="请输入PayPal Client Secret"
              show-password
            />
          </el-form-item>

          <el-form-item label="环境" prop="paypal.environment">
            <el-radio-group v-model="formData.paypal.environment">
              <el-radio-button label="sandbox">沙箱环境</el-radio-button>
              <el-radio-button label="production">生产环境</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="货币" prop="paypal.currency">
            <el-select v-model="formData.paypal.currency" placeholder="请选择货币" style="width: 100%">
              <el-option label="USD - 美元" value="USD" />
              <el-option label="EUR - 欧元" value="EUR" />
              <el-option label="GBP - 英镑" value="GBP" />
              <el-option label="AUD - 澳元" value="AUD" />
              <el-option label="CAD - 加元" value="CAD" />
              <el-option label="JPY - 日元" value="JPY" />
              <el-option label="CNY - 人民币" value="CNY" />
            </el-select>
          </el-form-item>

          <el-form-item label="回调地址" prop="paypal.returnUrl">
            <el-input v-model="formData.paypal.returnUrl" placeholder="https://your-domain.com/api/payment/paypal/return" />
          </el-form-item>

          <el-form-item label="取消地址" prop="paypal.cancelUrl">
            <el-input v-model="formData.paypal.cancelUrl" placeholder="https://your-domain.com/api/payment/paypal/cancel" />
          </el-form-item>

          <el-form-item label="Webhook ID" prop="paypal.webhookId">
            <el-input v-model="formData.paypal.webhookId" placeholder="请输入PayPal Webhook ID" />
          </el-form-item>
        </template>

        <!-- Stripe配置 -->
        <template v-if="formData.stripe.enabled">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="18" color="#635BFF"><CreditCard /></el-icon>
              Stripe配置
            </span>
          </el-divider>

          <el-form-item label="Publishable Key" prop="stripe.publishableKey">
            <el-input v-model="formData.stripe.publishableKey" placeholder="pk_live_... 或 pk_test_..." />
          </el-form-item>

          <el-form-item label="Secret Key" prop="stripe.secretKey">
            <el-input
              v-model="formData.stripe.secretKey"
              placeholder="sk_live_... 或 sk_test_..."
              show-password
            />
          </el-form-item>

          <el-form-item label="Webhook Secret" prop="stripe.webhookSecret">
            <el-input
              v-model="formData.stripe.webhookSecret"
              placeholder="whsec_..."
              show-password
            />
          </el-form-item>

          <el-form-item label="货币" prop="stripe.currency">
            <el-select v-model="formData.stripe.currency" placeholder="请选择货币" style="width: 100%">
              <el-option label="USD - 美元" value="USD" />
              <el-option label="EUR - 欧元" value="EUR" />
              <el-option label="GBP - 英镑" value="GBP" />
              <el-option label="AUD - 澳元" value="AUD" />
              <el-option label="CAD - 加元" value="CAD" />
              <el-option label="JPY - 日元" value="JPY" />
              <el-option label="CNY - 人民币" value="CNY" />
            </el-select>
          </el-form-item>

          <el-form-item label="返回地址" prop="stripe.returnUrl">
            <el-input v-model="formData.stripe.returnUrl" placeholder="https://your-domain.com/payment/success" />
          </el-form-item>
        </template>

        <!-- 微信收款码配置 -->
        <template v-if="formData.wechatQr.enabled">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="18" color="#07C160"><ChatDotRound /></el-icon>
              微信收款码配置
            </span>
          </el-divider>

          <el-form-item label="收款人姓名" prop="wechatQr.payeeName">
            <el-input v-model="formData.wechatQr.payeeName" placeholder="请输入收款人姓名" />
          </el-form-item>

          <el-form-item label="收款码图片" prop="wechatQr.qrCodeUrl">
            <div class="qr-code-uploader">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/jpeg,image/png,image/gif,image/webp"
                :on-change="(file: any) => handleQRCodeUpload({ file, type: 'wechat_qr' })"
              >
                <div v-if="formData.wechatQr.qrCodeUrl" class="qr-preview">
                  <el-image
                    :src="formData.wechatQr.qrCodeUrl"
                    :preview-src-list="[formData.wechatQr.qrCodeUrl]"
                    fit="contain"
                    style="width: 150px; height: 150px;"
                  />
                  <div class="qr-overlay">
                    <span>点击更换</span>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon :size="40"><Plus /></el-icon>
                  <div class="upload-text">上传微信收款码</div>
                </div>
              </el-upload>
              <el-input
                v-model="formData.wechatQr.qrCodeUrl"
                placeholder="或输入图片URL"
                style="margin-top: 10px;"
              />
            </div>
          </el-form-item>

          <el-form-item label="备注信息" prop="wechatQr.remark">
            <el-input
              v-model="formData.wechatQr.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息（显示给用户）"
            />
          </el-form-item>
        </template>

        <!-- 支付宝收款码配置 -->
        <template v-if="formData.alipayQr.enabled">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="18" color="#1677FF"><Wallet /></el-icon>
              支付宝收款码配置
            </span>
          </el-divider>

          <el-form-item label="收款人姓名" prop="alipayQr.payeeName">
            <el-input v-model="formData.alipayQr.payeeName" placeholder="请输入收款人姓名" />
          </el-form-item>

          <el-form-item label="收款码图片" prop="alipayQr.qrCodeUrl">
            <div class="qr-code-uploader">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/jpeg,image/png,image/gif,image/webp"
                :on-change="(file: any) => handleQRCodeUpload({ file, type: 'alipay_qr' })"
              >
                <div v-if="formData.alipayQr.qrCodeUrl" class="qr-preview">
                  <el-image
                    :src="formData.alipayQr.qrCodeUrl"
                    :preview-src-list="[formData.alipayQr.qrCodeUrl]"
                    fit="contain"
                    style="width: 150px; height: 150px;"
                  />
                  <div class="qr-overlay">
                    <span>点击更换</span>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon :size="40"><Plus /></el-icon>
                  <div class="upload-text">上传支付宝收款码</div>
                </div>
              </el-upload>
              <el-input
                v-model="formData.alipayQr.qrCodeUrl"
                placeholder="或输入图片URL"
                style="margin-top: 10px;"
              />
            </div>
          </el-form-item>

          <el-form-item label="备注信息" prop="alipayQr.remark">
            <el-input
              v-model="formData.alipayQr.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息（显示给用户）"
            />
          </el-form-item>
        </template>

        <!-- 通用设置 -->
        <el-divider content-position="left">通用设置</el-divider>

        <el-form-item label="默认货币" prop="general.currency">
          <el-select v-model="formData.general.currency" placeholder="请选择默认货币" style="width: 100%">
            <el-option label="CNY - 人民币" value="CNY" />
            <el-option label="USD - 美元" value="USD" />
            <el-option label="EUR - 欧元" value="EUR" />
            <el-option label="GBP - 英镑" value="GBP" />
            <el-option label="JPY - 日元" value="JPY" />
          </el-select>
        </el-form-item>

        <el-form-item label="汇率" prop="general.exchangeRate">
          <el-input-number
            v-model="formData.general.exchangeRate"
            :min="0.01"
            :max="100"
            :precision="4"
            :step="0.0001"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="最小支付金额" prop="general.minAmount">
          <el-input-number
            v-model="formData.general.minAmount"
            :min="0.01"
            :max="10000"
            :precision="2"
            :step="0.01"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>

        <el-form-item label="最大支付金额" prop="general.maxAmount">
          <el-input-number
            v-model="formData.general.maxAmount"
            :min="1"
            :max="1000000"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>

        <el-form-item label="默认支付金额" prop="general.defaultAmount">
          <el-input-number
            v-model="formData.general.defaultAmount"
            :min="0.01"
            :max="100000"
            :precision="2"
            :step="1"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>

        <el-form-item label="订单过期时间" prop="general.expireMinutes">
          <el-input-number
            v-model="formData.general.expireMinutes"
            :min="5"
            :max="1440"
            :step="5"
            style="width: 200px"
          />
          <span class="unit">分钟</span>
        </el-form-item>

        <el-form-item label="自动完成订单" prop="general.autoComplete">
          <el-switch v-model="formData.general.autoComplete" active-text="开启" inactive-text="关闭" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { Check, Connection, Wallet, ChatDotRound, CreditCard, Plus } from '@element-plus/icons-vue';
import {
  getPaymentSettings,
  updatePaymentSettings,
  testPaymentProvider,
  uploadQRCodeImage,
} from '../../api/settings';
import type { PaymentSettings } from '../../types/payment-settings';

const formRef = ref();
const loading = ref(false);

// 支付方式列表
const paymentMethods = [
  {
    key: 'alipay',
    name: '支付宝',
    icon: 'Wallet',
    color: '#1677FF',
  },
  {
    key: 'wechat',
    name: '微信支付',
    icon: 'ChatDotRound',
    color: '#07C160',
  },
  {
    key: 'paypal',
    name: 'PayPal',
    icon: 'CreditCard',
    color: '#003087',
  },
  {
    key: 'stripe',
    name: 'Stripe',
    icon: 'CreditCard',
    color: '#635BFF',
  },
  {
    key: 'wechatQr',
    name: '微信收款码',
    icon: 'ChatDotRound',
    color: '#07C160',
  },
  {
    key: 'alipayQr',
    name: '支付宝收款码',
    icon: 'Wallet',
    color: '#1677FF',
  },
];

// 表单数据
const formData = reactive({
  // 支付宝配置
  alipay: {
    enabled: false,
    appId: '',
    privateKey: '',
    publicKey: '',
    alipayPublicKey: '',
    gateway: 'https://openapi.alipay.com/gateway.do',
    notifyUrl: '',
    returnUrl: '',
    signType: 'RSA2',
    charset: 'utf-8',
  },
  // 微信支付配置
  wechat: {
    enabled: false,
    appId: '',
    mchId: '',
    apiKey: '',
    apiKeyV3: '',
    certPath: '',
    keyPath: '',
    notifyUrl: '',
    returnUrl: '',
    tradeType: 'NATIVE',
  },
  // PayPal配置
  paypal: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    currency: 'USD',
    returnUrl: '',
    cancelUrl: '',
    webhookId: '',
  },
  // Stripe配置
  stripe: {
    enabled: false,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    currency: 'USD',
    returnUrl: '',
  },
  // 微信收款码配置
  wechatQr: {
    enabled: false,
    payeeName: '',
    qrCodeUrl: '',
    remark: '',
  },
  // 支付宝收款码配置
  alipayQr: {
    enabled: false,
    payeeName: '',
    qrCodeUrl: '',
    remark: '',
  },
  // 通用设置
  general: {
    currency: 'CNY',
    exchangeRate: 1,
    minAmount: 1,
    maxAmount: 10000,
    defaultAmount: 10,
    enabledMethods: ['alipay', 'wechat'],
    autoComplete: true,
    expireMinutes: 30,
  },
});

// 加载配置
const loadSettings = async () => {
  loading.value = true;
  try {
    const settings = await getPaymentSettings();
    // 合并配置数据
    if (settings.alipay) {
      Object.assign(formData.alipay, settings.alipay);
    }
    if (settings.wechat) {
      Object.assign(formData.wechat, settings.wechat);
    }
    if (settings.paypal) {
      Object.assign(formData.paypal, settings.paypal);
    }
    if (settings.stripe) {
      Object.assign(formData.stripe, settings.stripe);
    }
    if (settings.wechatQr) {
      Object.assign(formData.wechatQr, settings.wechatQr);
    }
    if (settings.alipayQr) {
      Object.assign(formData.alipayQr, settings.alipayQr);
    }
    if (settings.general) {
      Object.assign(formData.general, settings.general);
    }
  } catch (error) {
    ElMessage.error('加载支付配置失败');
  } finally {
    loading.value = false;
  }
};

// 保存配置
const handleSave = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const settingsData = {
      alipay: { ...formData.alipay },
      wechat: { ...formData.wechat },
      paypal: { ...formData.paypal },
      stripe: { ...formData.stripe },
      wechatQr: { ...formData.wechatQr },
      alipayQr: { ...formData.alipayQr },
      general: { ...formData.general },
    };

    await updatePaymentSettings(settingsData);
    ElMessage.success('配置保存成功');
  } catch (error) {
    ElMessage.error('保存配置失败');
  } finally {
    loading.value = false;
  }
};

// 上传收款码图片
const handleQRCodeUpload = async (options: { file: any; type: 'wechat_qr' | 'alipay_qr' }) => {
  const { file, type } = options;

  // el-upload 传递的是 UploadFile 对象，需要通过 file.raw 获取原始 File
  const rawFile = file.raw || file;

  if (!rawFile) {
    ElMessage.error('无法获取文件对象');
    console.error('[Upload] No raw file object received');
    return;
  }

  console.log('[Upload] File received:', {
    name: rawFile.name,
    type: rawFile.type,
    size: rawFile.size,
    isFile: rawFile instanceof File,
  });

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片');
    return;
  }

  // 验证文件大小（最大5MB）
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB');
    return;
  }

  // 显示加载状态
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在上传...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    // 转换为 base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        console.log('[Upload] Base64 length:', base64?.length);

        const result = await uploadQRCodeImage(base64, type);
        console.log('[Upload] API response:', result);

        // 更新表单数据
        if (type === 'wechat_qr') {
          formData.wechatQr.qrCodeUrl = result.url;
        } else if (type === 'alipay_qr') {
          formData.alipayQr.qrCodeUrl = result.url;
        }

        ElMessage.success('收款码图片上传成功');
      } catch (uploadError: any) {
        console.error('[Upload] API call error:', uploadError);
        ElMessage.error(uploadError?.response?.data?.message || uploadError?.message || '图片上传失败，请重试');
      } finally {
        loadingInstance.close();
      }
    };
    reader.onerror = () => {
      console.error('[Upload] FileReader error');
      ElMessage.error('图片读取失败');
      loadingInstance.close();
    };
    reader.readAsDataURL(rawFile);
  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    ElMessage.error('图片上传失败');
    loadingInstance.close();
  }
};

// 测试连接
const handleTest = async () => {
  const enabledMethods = paymentMethods.filter(m => formData[m.key as keyof typeof formData].enabled);

  if (enabledMethods.length === 0) {
    ElMessage.warning('请至少启用一种支付方式');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `将对以下启用的支付方式进行连接测试：${enabledMethods.map(m => m.name).join('、')}`,
      '测试连接',
      {
        confirmButtonText: '开始测试',
        cancelButtonText: '取消',
        type: 'info',
      }
    );

    loading.value = true;
    const results: string[] = [];

    for (const method of enabledMethods) {
      try {
        const result = await testPaymentProvider(method.key, 0.01, formData.general.currency);
        results.push(`${method.name}: ${result.success ? '✅ 通过' : '❌ 失败'} - ${result.message}`);
      } catch (error) {
        results.push(`${method.name}: ❌ 测试失败`);
      }
    }

    ElMessageBox.alert(results.join('<br>'), '测试结果', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定',
    });
  } catch (error) {
    // 用户取消
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取配置
onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.payment-config {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .payment-methods-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
    }

    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;

      .payment-method-card {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 1px solid #dcdfe6;
        border-radius: 8px;
        background-color: #f5f7fa;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
        }

        &.enabled {
          background-color: #ecf5ff;
          border-color: #409eff;
        }

        .method-icon {
          width: 48px;
          height: 48px;
          margin-right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          border-radius: 8px;

          img {
            width: 32px;
            height: 32px;
            object-fit: contain;
          }
        }

        .method-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .method-name {
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }
  }

  .config-form {
    max-width: 700px;

    .divider-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;

      .divider-icon {
        width: 20px;
        height: 20px;
      }
    }
  }

  .unit {
    margin-left: 8px;
    color: #606266;
  }

  .qr-code-uploader {
    .qr-preview {
      position: relative;
      width: 150px;
      height: 150px;
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;

      &:hover {
        .qr-overlay {
          opacity: 1;
        }
      }

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }

    .qr-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      span {
        color: #fff;
        font-size: 14px;
      }
    }

    .upload-placeholder {
      width: 150px;
      height: 150px;
      border: 1px dashed #dcdfe6;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      background-color: #fafafa;

      &:hover {
        border-color: #409eff;
        background-color: #ecf5ff;
      }

      .upload-text {
        margin-top: 10px;
        font-size: 13px;
        color: #909399;
      }
    }

    :deep(.el-upload) {
      display: block;
    }
  }

  :deep(.el-divider__text) {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
}
</style>
