<template>
  <div class="ip-pool-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑IP池' : '创建IP池' }}</span>
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
            <el-form-item label="IP池名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入IP池名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联节点" prop="nodeId">
              <el-select
                v-model="formData.nodeId"
                placeholder="选择关联节点"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="node in nodeOptions"
                  :key="node.id"
                  :label="node.name"
                  :value="node.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP类型" prop="ipType">
              <el-radio-group v-model="formData.ipType">
                <el-radio-button :label="IpType.IPV4">IPv4</el-radio-button>
                <el-radio-button :label="IpType.IPV6">IPv6</el-radio-button>
                <el-radio-button :label="IpType.MIXED">混合</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                placeholder="可选，输入IP池描述"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Rotation Configuration -->
        <el-divider content-position="left">轮换配置</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="轮换策略" prop="rotationStrategy">
              <el-select
                v-model="formData.rotationStrategy"
                placeholder="选择轮换策略"
                style="width: 100%"
              >
                <el-option
                  v-for="strategy in rotationStrategies"
                  :key="strategy.value"
                  :label="strategy.label"
                  :value="strategy.value"
                >
                  <div class="strategy-option">
                    <span class="strategy-label">{{ strategy.label }}</span>
                    <span class="strategy-desc">{{ strategy.description }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="form-tip" v-if="selectedStrategyDesc">
                {{ selectedStrategyDesc }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="轮换间隔" prop="rotationInterval">
              <el-input-number
                v-model="formData.rotationInterval"
                :min="1"
                :max="1440"
                :step="5"
                style="width: 150px"
              />
              <span class="unit">分钟</span>
              <span class="form-tip">建议值：30-60分钟</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- IP List Management -->
        <el-divider content-position="left">IP列表管理</el-divider>

        <el-form-item label="IP地址列表" prop="ips">
          <div class="ip-list-section">
            <div class="ip-input-area">
              <el-input
                v-model="newIpInput"
                placeholder="输入IP地址，支持批量添加（每行一个）"
                type="textarea"
                :rows="3"
                @keydown.enter.prevent="handleAddIp"
              />
              <el-button type="primary" @click="handleAddIp" :disabled="!newIpInput.trim()">
                <el-icon><Plus /></el-icon>添加IP
              </el-button>
            </div>

            <div class="ip-table-wrapper" v-if="formData.ips.length > 0">
              <el-table :data="ipTableData" stripe size="small" max-height="300">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column prop="ip" label="IP地址" min-width="150">
                  <template #default="{ row }">
                    <el-input
                      v-if="row.isEditing"
                      v-model="row.editValue"
                      size="small"
                      @blur="saveIpEdit(row)"
                      @keyup.enter="saveIpEdit(row)"
                      v-focus
                    />
                    <span v-else>{{ row.ip }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag
                      :type="validateIp(row.ip) ? 'success' : 'danger'"
                      size="small"
                    >
                      {{ validateIp(row.ip) ? '有效' : '无效' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row, $index }">
                    <el-button type="primary" link size="small" @click="editIp(row)">
                      编辑
                    </el-button>
                    <el-button type="danger" link size="small" @click="removeIp($index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="ip-stats">
                <el-tag type="info" size="small">总计: {{ formData.ips.length }} 个IP</el-tag>
                <el-tag type="success" size="small">有效: {{ validIpCount }} 个</el-tag>
                <el-tag type="danger" size="small" v-if="invalidIpCount > 0">
                  无效: {{ invalidIpCount }} 个
                </el-tag>
              </div>
            </div>

            <el-empty v-else description="暂无IP地址，请在上方添加" />
          </div>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存修改' : '创建IP池' }}
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
import { Plus } from '@element-plus/icons-vue';
import {
  createIpPool,
  updateIpPool,
  getIpPoolById,
  getRotationStrategies,
} from '@api/ip-pools';
import { getNodes } from '@api/nodes';
import type { IpPoolFormData, RotationStrategyOption } from '../../types/ip-pool';
import { IpType, RotationStrategy } from '../../types/ip-pool';
import type { Node } from '../../types/node';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);

const isEdit = computed(() => !!route.params.id);
const poolId = computed(() => route.params.id as string);

const nodeOptions = ref<Node[]>([]);
const rotationStrategies = ref<RotationStrategyOption[]>([]);
const newIpInput = ref('');

interface IpTableRow {
  ip: string;
  isEditing: boolean;
  editValue: string;
}

const formData = reactive<IpPoolFormData>({
  name: '',
  nodeId: '',
  ipType: IpType.IPV4,
  rotationStrategy: RotationStrategy.ROUND_ROBIN,
  rotationInterval: 30,
  description: '',
  ips: [],
});

const ipTableData = computed<IpTableRow[]>(() => {
  return formData.ips.map((ip) => ({
    ip,
    isEditing: false,
    editValue: ip,
  }));
});

const validIpCount = computed(() => {
  return formData.ips.filter((ip) => validateIp(ip)).length;
});

const invalidIpCount = computed(() => {
  return formData.ips.filter((ip) => !validateIp(ip)).length;
});

const selectedStrategyDesc = computed(() => {
  const strategy = rotationStrategies.value.find(
    (s) => s.value === formData.rotationStrategy
  );
  return strategy?.description;
});

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入IP池名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  nodeId: [{ required: true, message: '请选择关联节点', trigger: 'change' }],
  ipType: [{ required: true, message: '请选择IP类型', trigger: 'change' }],
  rotationStrategy: [{ required: true, message: '请选择轮换策略', trigger: 'change' }],
  rotationInterval: [{ required: true, message: '请设置轮换间隔', trigger: 'blur' }],
  ips: [
    {
      validator: (_rule, value: string[], callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一个IP地址'));
        } else if (value.some((ip) => !validateIp(ip))) {
          callback(new Error('存在无效的IP地址，请检查'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
};

// IPv4 regex pattern
const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
// IPv6 regex pattern (simplified)
const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

const validateIp = (ip: string): boolean => {
  if (!ip) return false;
  const trimmedIp = ip.trim();
  if (formData.ipType === IpType.IPV4) {
    return ipv4Pattern.test(trimmedIp);
  } else if (formData.ipType === IpType.IPV6) {
    return ipv6Pattern.test(trimmedIp);
  } else {
    return ipv4Pattern.test(trimmedIp) || ipv6Pattern.test(trimmedIp);
  }
};

const fetchNodes = async () => {
  try {
    const res = await getNodes({ page: 1, pageSize: 1000 });
    nodeOptions.value = res.list;
  } catch (error) {
    ElMessage.error('获取节点列表失败');
  }
};

const fetchRotationStrategies = async () => {
  try {
    const res = await getRotationStrategies();
    rotationStrategies.value = res;
  } catch (error) {
    // Use default strategies if API fails
    rotationStrategies.value = [
      {
        value: RotationStrategy.ROUND_ROBIN,
        label: '轮询',
        description: '按顺序循环使用每个IP，确保负载均衡',
      },
      {
        value: RotationStrategy.RANDOM,
        label: '随机',
        description: '随机选择IP，适合无状态场景',
      },
      {
        value: RotationStrategy.LEAST_USED,
        label: '最少使用',
        description: '优先选择使用次数最少的IP',
      },
      {
        value: RotationStrategy.QUALITY_FIRST,
        label: '质量优先',
        description: '优先选择评分最高的IP',
      },
    ];
  }
};

const fetchPool = async () => {
  if (!isEdit.value) return;

  try {
    const pool = await getIpPoolById(poolId.value);
    Object.assign(formData, {
      name: pool.name,
      nodeId: pool.nodeId,
      ipType: pool.ipType,
      rotationStrategy: pool.rotationStrategy,
      rotationInterval: pool.rotationInterval,
      description: pool.description || '',
      ips: pool.ips.map((ip) => ip.ip),
    });
  } catch (error) {
    ElMessage.error('获取IP池信息失败');
  }
};

const handleAddIp = () => {
  if (!newIpInput.value.trim()) return;

  const ips = newIpInput.value
    .split('\n')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

  const newIps = ips.filter((ip) => !formData.ips.includes(ip));
  const duplicates = ips.filter((ip) => formData.ips.includes(ip));

  if (newIps.length > 0) {
    formData.ips.push(...newIps);
    ElMessage.success(`成功添加 ${newIps.length} 个IP地址`);
  }

  if (duplicates.length > 0) {
    ElMessage.warning(`${duplicates.length} 个IP已存在，已跳过`);
  }

  newIpInput.value = '';
};

const editIp = (row: IpTableRow) => {
  row.isEditing = true;
  row.editValue = row.ip;
};

const saveIpEdit = (row: IpTableRow) => {
  const index = formData.ips.indexOf(row.ip);
  if (index > -1) {
    const newIp = row.editValue.trim();
    if (newIp && !formData.ips.includes(newIp)) {
      formData.ips[index] = newIp;
      row.ip = newIp;
      ElMessage.success('IP地址已更新');
    } else if (newIp !== row.ip && formData.ips.includes(newIp)) {
      ElMessage.warning('该IP地址已存在');
    }
  }
  row.isEditing = false;
};

const removeIp = (index: number) => {
  formData.ips.splice(index, 1);
  ElMessage.success('IP地址已删除');
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        if (isEdit.value) {
          await updateIpPool(poolId.value, formData);
          ElMessage.success('IP池已更新');
        } else {
          await createIpPool(formData);
          ElMessage.success('IP池已创建');
        }
        router.push('/ip-pools');
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// Custom directive for auto-focus
const vFocus = {
  mounted: (el: HTMLElement) => {
    el.querySelector('input')?.focus();
  },
};

onMounted(() => {
  fetchNodes();
  fetchRotationStrategies();
  fetchPool();
});
</script>

<style scoped lang="scss">
.ip-pool-form {
  min-height: calc(100vh - 120px);

  .card-header {
    font-weight: 600;
  }

  .form-content {
    max-width: 1000px;
    margin: 0 auto;
  }

  .unit {
    margin-left: 8px;
    color: #606266;
  }

  .form-tip {
    margin-top: 4px;
    color: #909399;
    font-size: 13px;
  }

  .strategy-option {
    display: flex;
    flex-direction: column;
    padding: 4px 0;

    .strategy-label {
      font-weight: 500;
    }

    .strategy-desc {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .ip-list-section {
    .ip-input-area {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .el-textarea {
        flex: 1;
      }

      .el-button {
        align-self: flex-start;
      }
    }

    .ip-table-wrapper {
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 12px;
      background-color: #fafafa;

      .ip-stats {
        margin-top: 12px;
        display: flex;
        gap: 8px;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #dcdfe6;
  }
}
</style>
