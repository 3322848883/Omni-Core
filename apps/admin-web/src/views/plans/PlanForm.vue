<template>
  <div class="plan-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑套餐' : '创建套餐' }}</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="plan-form-content"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入套餐名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐ID" prop="id">
              <el-input v-model="formData.id" placeholder="唯一标识，如: standard-pro" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="formData.price" :min="0" :precision="2" :step="1" style="width: 200px" />
              <span class="unit">USD</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时长" prop="durationDays">
              <el-input-number v-model="formData.durationDays" :min="1" :step="1" style="width: 200px" />
              <span class="unit">天</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">服务类型配置</el-divider>

        <el-form-item label="包含服务类型" prop="serviceTypes">
          <el-checkbox-group v-model="formData.serviceTypes">
            <el-checkbox
              v-for="type in serviceTypes"
              :key="type"
              :label="type"
              border
              class="service-type-checkbox"
            >
              <div class="checkbox-content">
                <span
                  class="type-dot"
                  :style="{ backgroundColor: getServiceTypeColor(type) }"
                />
                <span>{{ getServiceTypeLabel(type) }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="主要服务类型" prop="primaryType">
          <el-select v-model="formData.primaryType" placeholder="选择主要服务类型" style="width: 300px">
            <el-option
              v-for="type in formData.serviceTypes"
              :key="type"
              :label="getServiceTypeLabel(type)"
              :value="type"
            >
              <div class="option-content">
                <span
                  class="type-dot"
                  :style="{ backgroundColor: getServiceTypeColor(type) }"
                />
                <span>{{ getServiceTypeLabel(type) }}</span>
              </div>
            </el-option>
          </el-select>
          <span class="form-tip">主要服务类型决定了套餐的展示分类</span>
        </el-form-item>

        <el-divider content-position="left">资源限制</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="流量限制" prop="trafficLimit">
              <el-input-number
                v-model="trafficLimitGB"
                :min="1"
                :step="10"
                style="width: 200px"
              />
              <span class="unit">GB</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备数量" prop="maxConnections">
              <el-input-number v-model="formData.maxConnections" :min="1" :max="50" style="width: 200px" />
              <span class="unit">台</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="保证带宽" prop="guaranteedBandwidth">
              <el-input-number
                v-model="formData.guaranteedBandwidth"
                :min="1"
                :step="10"
                style="width: 200px"
              />
              <span class="unit">Mbps</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级提升" prop="priorityBoost">
              <el-slider
                v-model="formData.priorityBoost"
                :min="0"
                :max="5"
                :step="1"
                show-stops
                show-input
                style="width: 300px"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">功能特性</el-divider>

        <el-form-item label="功能列表" prop="features">
          <div class="features-list">
            <div
              v-for="(_, index) in formData.features"
              :key="index"
              class="feature-item"
            >
              <el-input v-model="formData.features[index]" placeholder="功能描述">
                <template #append>
                  <el-button @click="removeFeature(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </div>
            <el-button type="primary" plain @click="addFeature">
              <el-icon><Plus /></el-icon>
              添加功能
            </el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">其他设置</el-divider>

        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :step="1" />
          <span class="form-tip">数值越大，排序越靠前</span>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch
            v-model="formData.isEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存修改' : '创建套餐' }}
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
import { Plus, Delete } from '@element-plus/icons-vue';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  PRESET_PLANS,
} from '@shared/constants/service-type.mjs';

interface PlanFormData {
  id: string;
  name: string;
  serviceTypes: ServiceType[];
  primaryType: ServiceType;
  price: number;
  durationDays: number;
  trafficLimit: number;
  maxConnections: number;
  priorityBoost: number;
  guaranteedBandwidth: number;
  features: string[];
  sortOrder: number;
  isEnabled: boolean;
}

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);

const isEdit = computed(() => !!route.params.id);
const planId = computed(() => route.params.id as string);

const serviceTypes = getAllServiceTypes();

const formData = reactive<PlanFormData>({
  id: '',
  name: '',
  serviceTypes: [ServiceType.STANDARD],
  primaryType: ServiceType.STANDARD,
  price: 9.99,
  durationDays: 30,
  trafficLimit: 107374182400, // 100GB
  maxConnections: 3,
  priorityBoost: 0,
  guaranteedBandwidth: 20,
  features: ['标准节点访问', '基础客服支持'],
  sortOrder: 0,
  isEnabled: true,
});

const trafficLimitGB = computed({
  get: () => Math.round(formData.trafficLimit / (1024 * 1024 * 1024)),
  set: (val: number) => {
    formData.trafficLimit = val * 1024 * 1024 * 1024;
  },
});

const formRules: FormRules = {
  id: [
    { required: true, message: '请输入套餐ID', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能使用小写字母、数字和连字符', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入套餐名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  serviceTypes: [
    { required: true, message: '请至少选择一种服务类型', trigger: 'change', type: 'array', min: 1 },
  ],
  primaryType: [{ required: true, message: '请选择主要服务类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  durationDays: [{ required: true, message: '请输入时长', trigger: 'blur' }],
  trafficLimit: [{ required: true, message: '请输入流量限制', trigger: 'blur' }],
  maxConnections: [{ required: true, message: '请输入设备数量', trigger: 'blur' }],
};

const addFeature = () => {
  formData.features.push('');
};

const removeFeature = (index: number) => {
  formData.features.splice(index, 1);
};

const fetchPlan = () => {
  if (!isEdit.value) return;

  const plan = PRESET_PLANS.find((p) => p.id === planId.value);
  if (plan) {
    Object.assign(formData, {
      ...plan,
      isEnabled: true,
      sortOrder: 0,
    });
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        // Validate primary type is in service types
        if (!formData.serviceTypes.includes(formData.primaryType)) {
          ElMessage.error('主要服务类型必须在所选服务类型中');
          return;
        }

        // API call would go here
        await new Promise((resolve) => setTimeout(resolve, 500));

        ElMessage.success(isEdit.value ? '套餐已更新' : '套餐已创建');
        router.push('/plans');
      } catch (error) {
        ElMessage.error('操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchPlan();
});
</script>

<style scoped lang="scss">
.plan-form {
  min-height: calc(100vh - 120px);

  .card-header {
    font-weight: 600;
  }

  .plan-form-content {
    max-width: 900px;
    margin: 0 auto;
  }

  .unit {
    margin-left: 8px;
    color: #606266;
  }

  .form-tip {
    margin-left: 12px;
    color: #909399;
    font-size: 13px;
  }

  .service-type-checkbox {
    margin-right: 12px;
    margin-bottom: 8px;

    .checkbox-content {
      display: flex;
      align-items: center;
      gap: 6px;

      .type-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .type-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }

  .features-list {
    .feature-item {
      margin-bottom: 12px;
      max-width: 500px;
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
