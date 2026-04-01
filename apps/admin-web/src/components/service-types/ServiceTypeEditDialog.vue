<template>
  <el-dialog
    v-model="visible"
    title="编辑服务类型"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-if="serviceType"
    >
      <el-divider content-position="left">基本信息</el-divider>

      <el-form-item label="类型标识">
        <el-input v-model="formData.type" disabled />
        <span class="form-tip">类型标识不可修改</span>
      </el-form-item>

      <el-form-item label="显示名称" prop="label">
        <el-input v-model="formData.label" placeholder="请输入显示名称" maxlength="20" show-word-limit />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入服务类型描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-divider content-position="left">视觉样式</el-divider>

      <el-form-item label="主题颜色" prop="color">
        <div class="color-picker-wrapper">
          <el-color-picker v-model="formData.color" show-alpha />
          <span class="color-value">{{ formData.color }}</span>
        </div>
      </el-form-item>

      <el-form-item label="背景颜色" prop="bgColor">
        <div class="color-picker-wrapper">
          <el-color-picker v-model="formData.bgColor" show-alpha />
          <span class="color-value">{{ formData.bgColor }}</span>
        </div>
      </el-form-item>

      <el-form-item label="图标" prop="icon">
        <div class="icon-selector">
          <div
            v-for="icon in availableIcons"
            :key="icon.value"
            class="icon-option"
            :class="{ active: formData.icon === icon.value }"
            @click="formData.icon = icon.value"
          >
            <el-icon :size="24">
              <component :is="icon.component" />
            </el-icon>
            <span class="icon-name">{{ icon.label }}</span>
          </div>
        </div>
      </el-form-item>

      <el-divider content-position="left">优先级配置</el-divider>

      <el-form-item label="优先级" prop="priority">
        <el-slider
          v-model="formData.priority"
          :min="1"
          :max="5"
          :step="1"
          show-stops
          show-input
        />
        <span class="form-tip">优先级越高，在节点排序中越靠前</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  Promotion,
  Medal,
  Lock,
  Star,
  Lightning,
  Trophy,
  Flag,
  Location,
  Compass,
} from '@element-plus/icons-vue';
import { ServiceType, ServiceTypeMeta } from '@shared/constants/service-type.mjs';

interface FormData {
  type: ServiceType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
}

const props = defineProps<{
  modelValue: boolean;
  serviceType: ServiceType | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: FormData];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const formRef = ref<FormInstance>();
const submitting = ref(false);

const availableIcons = [
  { value: 'plane', label: '飞机', component: Promotion },
  { value: 'crown', label: '皇冠', component: Medal },
  { value: 'shield', label: '盾牌', component: Lock },
  { value: 'star', label: '星星', component: Star },
  { value: 'lightning', label: '闪电', component: Lightning },
  { value: 'trophy', label: '奖杯', component: Trophy },
  { value: 'medal', label: '勋章', component: Medal },
  { value: 'flag', label: '旗帜', component: Flag },
  { value: 'location', label: '定位', component: Location },
  { value: 'compass', label: '指南针', component: Compass },
];

const formData = ref<FormData>({
  type: ServiceType.STANDARD,
  label: '',
  description: '',
  color: '',
  bgColor: '',
  icon: 'plane',
  priority: 1,
});

const formRules: FormRules = {
  label: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' },
  ],
  color: [{ required: true, message: '请选择主题颜色', trigger: 'change' }],
  bgColor: [{ required: true, message: '请选择背景颜色', trigger: 'change' }],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }],
  priority: [{ required: true, message: '请设置优先级', trigger: 'change' }],
};

// 初始化表单数据
watch(
  () => props.serviceType,
  (type) => {
    if (type && visible.value) {
      const meta = ServiceTypeMeta[type];
      formData.value = {
        type,
        label: meta.label,
        description: meta.description,
        color: meta.color,
        bgColor: meta.bgColor,
        icon: meta.icon,
        priority: meta.priority,
      };
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        emit('submit', { ...formData.value });
        ElMessage.success('保存成功');
        visible.value = false;
      } catch (error) {
        ElMessage.error('保存失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  .color-value {
    font-family: monospace;
    font-size: 14px;
    color: #606266;
  }
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;

  .icon-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    border: 2px solid #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
    }

    &.active {
      border-color: #409eff;
      background-color: #ecf5ff;
    }

    .icon-name {
      font-size: 12px;
      color: #606266;
    }
  }
}
</style>
