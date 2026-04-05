<template>
  <div class="node-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑节点' : '创建节点' }}</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="form-content"
      >
        <!-- Basic Information -->
        <el-divider content-position="left">基本信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="节点名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入节点名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机地址" prop="host">
              <el-input v-model="formData.host" placeholder="请输入主机地址或IP" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="formData.port" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="formData.protocol" placeholder="选择协议" style="width: 100%">
                <el-option label="VMess" value="vmess" />
                <el-option label="VLESS" value="vless" />
                <el-option label="Trojan" value="trojan" />
                <el-option label="Shadowsocks" value="shadowsocks" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="网络类型" prop="network">
              <el-select v-model="formData.network" placeholder="选择网络类型" style="width: 100%">
                <el-option label="TCP" value="tcp" />
                <el-option label="WebSocket" value="ws" />
                <el-option label="gRPC" value="grpc" />
                <el-option label="HTTP/2" value="h2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="安全类型" prop="security">
              <el-select v-model="formData.security" placeholder="选择安全类型" style="width: 100%">
                <el-option label="TLS" value="tls" />
                <el-option label="XTLS" value="xtls" />
                <el-option label="None" value="none" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区" prop="region">
              <el-input v-model="formData.region" placeholder="如: 香港、洛杉矶" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- IP Asset Configuration -->
        <el-divider content-position="left">
          <span class="divider-title">
            <el-icon><OfficeBuilding /></el-icon>
            IP 资产配置
          </span>
        </el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="IP 类型" prop="ipType">
              <el-select v-model="formData.ipType" placeholder="选择IP类型" style="width: 100%">
                <el-option
                  v-for="type in ipTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                >
                  <div class="ip-type-option">
                    <el-icon :size="16">
                      <component :is="type.icon" />
                    </el-icon>
                    <span>{{ type.label }}</span>
                    <el-tooltip :content="type.description" placement="right">
                      <el-icon class="info-icon"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="线路类型" prop="lineType">
              <el-select v-model="formData.lineType" placeholder="选择线路类型" style="width: 100%">
                <el-option
                  v-for="line in lineTypeOptions"
                  :key="line.value"
                  :label="line.label"
                  :value="line.value"
                >
                  <div class="line-type-option">
                    <span>{{ line.label }}</span>
                    <el-tag size="small" :type="getLineTypeTagType(line.priority)">
                      优先级 {{ line.priority }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="ISP 运营商" prop="ispCode">
              <el-select
                v-model="formData.ispCode"
                placeholder="选择ISP"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="isp in ispOptions"
                  :key="isp.code"
                  :label="isp.name"
                  :value="isp.code"
                >
                  <div class="isp-option">
                    <span>{{ isp.name }}</span>
                    <el-tag size="small" type="info">{{ isp.country }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IPv6 支持">
              <el-switch
                v-model="formData.supportsIpv6"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.supportsIpv6">
            <el-form-item label="IPv6 地址" prop="ipv6Address">
              <el-input
                v-model="formData.ipv6Address"
                placeholder="请输入IPv6地址"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- IP Pool Configuration (for dynamic residential IP) -->
        <template v-if="formData.ipType === IpType.DYNAMIC_RESIDENTIAL">
          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon><Refresh /></el-icon>
              IP 池配置
            </span>
          </el-divider>

          <el-card class="ip-pool-card" shadow="never">
            <el-form-item label="启用IP轮换">
              <el-switch
                v-model="ipPoolConfig.rotationEnabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>

            <template v-if="ipPoolConfig.rotationEnabled">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="轮换间隔">
                    <el-input-number
                      v-model="ipPoolConfig.rotationInterval"
                      :min="5"
                      :max="1440"
                      :step="5"
                      style="width: 150px"
                    />
                    <span class="unit">分钟</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="最小健康IP数">
                    <el-input-number
                      v-model="ipPoolConfig.minHealthyIps"
                      :min="1"
                      :max="100"
                      style="width: 150px"
                    />
                    <span class="form-tip">低于此数量将触发告警</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="最大IP数">
                    <el-input-number
                      v-model="ipPoolConfig.maxIps"
                      :min="1"
                      :max="500"
                      style="width: 150px"
                    />
                    <span class="form-tip">IP池上限</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <el-alert
              v-else
              title="IP轮换已禁用"
              description="禁用后节点将使用固定IP地址，适用于静态住宅IP或机房IP场景。"
              type="info"
              :closable="false"
              show-icon
              style="margin-top: 16px"
            />
          </el-card>
        </template>

        <!-- Service Type Configuration -->
        <el-divider content-position="left">服务类型配置</el-divider>

        <el-form-item label="服务类型" prop="serviceType">
          <ServiceTypeSelector v-model="formData.serviceType as ServiceType" @change="handleServiceTypeChange" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="QoS等级" prop="qosLevel">
              <div class="qos-slider-wrapper">
                <el-slider
                  v-model="formData.qosLevel"
                  :min="1"
                  :max="5"
                  :step="1"
                  show-stops
                  show-input
                />
                <div class="qos-labels">
                  <span>基础</span>
                  <span>标准</span>
                  <span>高级</span>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="带宽限制" prop="bandwidthLimit">
              <el-input-number
                v-model="formData.bandwidthLimit"
                :min="1"
                :step="10"
                style="width: 150px"
              />
              <span class="unit">Mbps</span>
              <span class="form-tip">0表示无限制</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Resource Limits -->
        <el-divider content-position="left">资源限制</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大用户数" prop="maxUsers">
              <el-input-number v-model="formData.maxUsers" :min="1" :max="10000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="流量限制(GB)" prop="trafficLimit">
              <el-input-number v-model="trafficLimitGB" :min="0" :step="10" style="width: 150px" />
              <span class="unit">GB</span>
              <span class="form-tip">0表示无限制</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Tags -->
        <el-divider content-position="left">标签</el-divider>

        <el-form-item label="节点标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或输入标签"
            style="width: 100%"
          >
            <el-option label="推荐" value="推荐" />
            <el-option label="高速" value="高速" />
            <el-option label="稳定" value="稳定" />
            <el-option label="新节点" value="新节点" />
            <el-option label="BGP" value="BGP" />
            <el-option label="CN2" value="CN2" />
          </el-select>
        </el-form-item>

        <!-- Advanced Configuration -->
        <el-divider content-position="left">高级配置</el-divider>

        <el-form-item label="启用状态">
          <el-switch
            v-model="formData.isEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :step="1" />
          <span class="form-tip">数值越大，排序越靠前</span>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存修改' : '创建节点' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  OfficeBuilding,
  Refresh,
  InfoFilled,
} from '@element-plus/icons-vue';
import ServiceTypeSelector from '@components/nodes/ServiceTypeSelector.vue';
import { createNode, updateNode, getNodeById, getIpMetadata } from '@api/nodes';
import { ServiceType } from '@shared/constants/service-type.mjs';
import {
  IpType,
  LineType,
  type NodeFormData,
  type IpPoolConfig,
  type IpMetadata,
} from '../../types/node';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);

const isEdit = computed(() => !!route.params.id);
const nodeId = computed(() => route.params.id as string);

// IP metadata options
const ipTypeOptions = ref<IpMetadata['ipTypes']>([
  { value: IpType.DATACENTER, label: '机房', description: '数据中心IP，稳定性高，适合长期运行', icon: 'OfficeIcon' },
  { value: IpType.DYNAMIC_RESIDENTIAL, label: '动态住宅', description: '动态轮换住宅IP，匿名性高', icon: 'Refresh' },
  { value: IpType.STATIC_RESIDENTIAL, label: '静态住宅', description: '固定住宅IP，稳定性与匿名性兼顾', icon: 'HomeFilled' },
  { value: IpType.MOBILE, label: '移动', description: '移动网络IP，适合移动端场景', icon: 'Iphone' },
]);

const lineTypeOptions = ref<IpMetadata['lineTypes']>([
  { value: LineType.STANDARD, label: '标准线路', description: '普通国际线路', priority: 1 },
  { value: LineType.CN2, label: 'CN2', description: '中国电信CN2优质线路', priority: 2 },
  { value: LineType.IEPL, label: 'IEPL', description: '国际以太网专线', priority: 3 },
  { value: LineType.IPLC, label: 'IPLC', description: '国际私人租用线路，最高质量', priority: 4 },
]);

const ispOptions = ref<IpMetadata['isps']>([
  { code: 'starlink', name: 'Starlink', country: 'US', type: 'isp' },
  { code: 'comcast', name: 'Comcast', country: 'US', type: 'isp' },
  { code: 'att', name: 'AT&T', country: 'US', type: 'isp' },
  { code: 'verizon', name: 'Verizon', country: 'US', type: 'isp' },
  { code: 'tmobile', name: 'T-Mobile', country: 'US', type: 'mobile' },
  { code: 'chinamobile', name: '中国移动', country: 'CN', type: 'mobile' },
  { code: 'chinatelecom', name: '中国电信', country: 'CN', type: 'isp' },
  { code: 'chinaunicom', name: '中国联通', country: 'CN', type: 'isp' },
  { code: 'ntt', name: 'NTT', country: 'JP', type: 'isp' },
  { code: 'softbank', name: 'SoftBank', country: 'JP', type: 'isp' },
  { code: 'singtel', name: 'Singtel', country: 'SG', type: 'isp' },
  { code: 'digitalocean', name: 'DigitalOcean', country: 'US', type: 'datacenter' },
  { code: 'aws', name: 'AWS', country: 'US', type: 'datacenter' },
  { code: 'gcp', name: 'Google Cloud', country: 'US', type: 'datacenter' },
  { code: 'azure', name: 'Azure', country: 'US', type: 'datacenter' },
  { code: 'aliyun', name: '阿里云', country: 'CN', type: 'datacenter' },
  { code: 'tencent', name: '腾讯云', country: 'CN', type: 'datacenter' },
]);

const ipPoolConfig = reactive<IpPoolConfig>({
  rotationEnabled: false,
  rotationInterval: 60,
  minHealthyIps: 5,
  maxIps: 50,
});

const formData = reactive<NodeFormData & { sortOrder: number; isEnabled: boolean }>({
  name: '',
  host: '',
  port: 443,
  protocol: 'vmess',
  network: 'tcp',
  security: 'tls',
  country: '',
  region: '',
  serviceType: ServiceType.STANDARD,
  qosLevel: 3,
  bandwidthLimit: 100,
  maxUsers: 100,
  trafficLimit: 0,
  tags: [],
  config: {},
  serviceGroup: '',
  isPremium: false,
  sortOrder: 0,
  isEnabled: true,
  // IP Asset fields
  ipType: IpType.DATACENTER,
  lineType: LineType.STANDARD,
  isp: '',
  ispCode: '',
  supportsIpv6: false,
  ipv6Address: '',
});

const trafficLimitGB = computed({
  get: () => (formData.trafficLimit / (1024 * 1024 * 1024)),
  set: (val: number) => {
    formData.trafficLimit = val * 1024 * 1024 * 1024;
  },
});

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' },
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }],
  network: [{ required: true, message: '请选择网络类型', trigger: 'change' }],
  security: [{ required: true, message: '请选择安全类型', trigger: 'change' }],
  region: [{ required: true, message: '请输入地区', trigger: 'blur' }],
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  qosLevel: [{ required: true, message: '请设置QoS等级', trigger: 'change' }],
  maxUsers: [{ required: true, message: '请输入最大用户数', trigger: 'blur' }],
  ipType: [{ required: true, message: '请选择IP类型', trigger: 'change' }],
  lineType: [{ required: true, message: '请选择线路类型', trigger: 'change' }],
};

const getLineTypeTagType = (priority: number): string => {
  if (priority >= 4) return 'danger';
  if (priority >= 3) return 'warning';
  if (priority >= 2) return 'success';
  return 'info';
};

const handleServiceTypeChange = (type: ServiceType) => {
  // Auto-adjust QoS level based on service type
  if (type === ServiceType.EXCLUSIVE) {
    formData.qosLevel = 5;
  } else if (type === ServiceType.DEDICATED_LINE) {
    formData.qosLevel = 4;
  } else {
    formData.qosLevel = 3;
  }

  // Auto-adjust line type based on service type
  if (type === ServiceType.EXCLUSIVE) {
    formData.lineType = LineType.IPLC;
  } else if (type === ServiceType.DEDICATED_LINE) {
    formData.lineType = LineType.IEPL;
  }
};

const fetchMetadata = async () => {
  try {
    const metadata = await getIpMetadata();
    if (metadata.ipTypes) {
      ipTypeOptions.value = metadata.ipTypes;
    }
    if (metadata.lineTypes) {
      lineTypeOptions.value = metadata.lineTypes;
    }
    if (metadata.isps) {
      ispOptions.value = metadata.isps;
    }
  } catch (error) {
    // Use default values if API fails
    console.warn('Failed to fetch IP metadata, using defaults');
  }
};

const fetchNode = async () => {
  if (!isEdit.value) return;

  try {
    const node = await getNodeById(nodeId.value);
    
    // Map API response fields to form fields
    Object.assign(formData, {
      name: node.name || '',
      host: node.host || '',
      port: node.port || 443,
      protocol: node.protocol || 'vless',
      network: 'tcp', // Default value, API doesn't provide this
      security: 'tls', // Default value, API doesn't provide this
      region: node.region || '',
      country: node.country || '',
      serviceType: node.serviceType || ServiceType.STANDARD,
      qosLevel: node.qosLevel || 3,
      bandwidthLimit: node.bandwidthLimit ? node.bandwidthLimit / (1024 * 1024) : 100,
      maxUsers: node.maxUsers || 100,
      trafficLimit: 0, // Default value, API doesn't provide this
      tags: [], // Default value, API doesn't provide this
      isEnabled: node.status === 'online',
      sortOrder: node.priority || 0,
      // IP Asset fields - map from API response
      ipType: node.ipType || IpType.DATACENTER,
      lineType: node.lineType || LineType.STANDARD,
      isp: node.ispName || '',
      ispCode: '', // API doesn't provide ispCode, only ispName
      supportsIpv6: node.supportsIpv6 || false,
      ipv6Address: '', // API doesn't provide this
    });

    // Set ISP code based on name
    if (formData.isp && !formData.ispCode) {
      const isp = ispOptions.value.find(i => i.name === formData.isp);
      if (isp) {
        formData.ispCode = isp.code;
      }
    }

    // Load IP pool config if exists
    if (node.ipPoolInfo) {
      Object.assign(ipPoolConfig, {
        rotationEnabled: node.ipRotationEnabled || false,
        rotationInterval: node.ipRotationInterval || 60,
        minHealthyIps: node.ipPoolInfo.minHealthyIps || 5,
        maxIps: node.ipPoolInfo.maxIps || 50,
      });
    }
  } catch (error) {
    ElMessage.error('获取节点信息失败');
    console.error('Failed to fetch node:', error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        // Set ISP name based on code
        const selectedIsp = ispOptions.value.find(i => i.code === formData.ispCode);
        if (selectedIsp) {
          formData.isp = selectedIsp.name;
        }

        const submitData: NodeFormData = {
          ...formData,
          bandwidthLimit: (formData.bandwidthLimit || 100) * 1024 * 1024, // Convert to bytes
          // Include IP pool config for dynamic residential IP
          ipPoolConfig: formData.ipType === IpType.DYNAMIC_RESIDENTIAL
            ? { ...ipPoolConfig }
            : undefined,
        };

        if (isEdit.value) {
          await updateNode(nodeId.value, submitData);
          ElMessage.success('节点已更新');
        } else {
          await createNode(submitData);
          ElMessage.success('节点已创建');
        }
        router.push('/nodes');
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchMetadata();
  fetchNode();
});
</script>

<style scoped lang="scss">
.node-form {
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 20px;

  .el-card {
    background: rgba(26, 26, 46, 0.8);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    .el-card__header {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);
      color: #00ffff;
      font-weight: bold;
    }
  }

  .card-header {
    font-weight: 600;
  }

  .form-content {
    max-width: 1000px;
    margin: 0 auto;

    .el-form-item {
      .el-form-item__label {
        color: #8a94a6;
        font-weight: 600;
      }

      .el-input {
        .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }

          &.is-focus {
            border-color: #00ffff;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
          }
        }
      }

      .el-input-number {
        .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }

          &.is-focus {
            border-color: #00ffff;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
          }
        }

        .el-input-number__decrease,
        .el-input-number__increase {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            background: rgba(26, 26, 46, 1);
            border-color: #00ffff;
            color: #00ffff;
          }

          &.is-disabled {
            color: #8a94a6;
            border-color: rgba(0, 255, 255, 0.1);
          }
        }
      }

      .el-select {
        .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }

          &.is-focus {
            border-color: #00ffff;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
          }
        }

        .el-select-dropdown {
          background: rgba(26, 26, 46, 0.95);
          border: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);

          .el-select-dropdown__item {
            color: #e6e6e6;

            &:hover {
              background: rgba(0, 255, 255, 0.1);
              color: #00ffff;
            }

            &.is-selected {
              background: rgba(0, 255, 255, 0.2);
              color: #00ffff;
            }
          }
        }
      }

      .el-switch {
        .el-switch__core {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
          }

          &.is-active {
            background: linear-gradient(45deg, #00ffff, #0080ff);
            border-color: #00ffff;
          }
        }

        .el-switch__action {
          border: 1px solid rgba(0, 255, 255, 0.3);
        }
      }

      .el-slider {
        .el-slider__runway {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
        }

        .el-slider__bar {
          background: linear-gradient(90deg, #00ffff, #0080ff);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .el-slider__button {
          border: 2px solid #00ffff;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);

          &:hover {
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
          }
        }

        .el-slider__input {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }
        }
      }
    }
  }

  .unit {
    margin-left: 8px;
    color: #8a94a6;
  }

  .form-tip {
    margin-left: 12px;
    color: #8a94a6;
    font-size: 13px;
  }

  .qos-slider-wrapper {
    .qos-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 12px;
      color: #8a94a6;
      padding: 0 10px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 255, 255, 0.2);

    .el-button {
      &.el-button--primary {
        background: linear-gradient(45deg, #00ffff, #0080ff);
        border: none;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

        &:hover {
          background: linear-gradient(45deg, #00ffff, #00a0ff);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
      }

      &.el-button--default {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }
      }
    }
  }

  .el-divider {
    background: rgba(0, 255, 255, 0.2);

    .el-divider__text {
      color: #00ffff;
      background: rgba(26, 26, 46, 0.9);
    }
  }

  .divider-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #00ffff;

    .el-icon {
      font-size: 16px;
      color: #00ffff;
    }
  }

  .ip-type-option {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #e6e6e6;

    .info-icon {
      margin-left: auto;
      color: #8a94a6;
      font-size: 14px;

      &:hover {
        color: #00ffff;
      }
    }
  }

  .line-type-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: #e6e6e6;

    .el-tag {
      &.el-tag--danger {
        background: rgba(245, 108, 108, 0.2);
        border: 1px solid rgba(245, 108, 108, 0.5);
        color: #f56c6c;
      }

      &.el-tag--warning {
        background: rgba(230, 162, 60, 0.2);
        border: 1px solid rgba(230, 162, 60, 0.5);
        color: #e6a23c;
      }

      &.el-tag--success {
        background: rgba(103, 194, 58, 0.2);
        border: 1px solid rgba(103, 194, 58, 0.5);
        color: #67c23a;
      }

      &.el-tag--info {
        background: rgba(144, 147, 153, 0.2);
        border: 1px solid rgba(144, 147, 153, 0.5);
        color: #909399;
      }
    }
  }

  .isp-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: #e6e6e6;

    .el-tag {
      &.el-tag--info {
        background: rgba(144, 147, 153, 0.2);
        border: 1px solid rgba(144, 147, 153, 0.5);
        color: #909399;
      }
    }
  }

  .ip-pool-card {
    background: rgba(26, 26, 46, 0.6);
    border: 1px solid rgba(0, 255, 255, 0.2);
    border-radius: 8px;
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 20px;
    }

    .el-alert {
      background: rgba(26, 26, 46, 0.8);
      border: 1px solid rgba(0, 255, 255, 0.2);
      color: #8a94a6;

      .el-alert__title {
        color: #00ffff;
      }

      .el-alert__icon {
        color: #00ffff;
      }
    }
  }
}
</style>
