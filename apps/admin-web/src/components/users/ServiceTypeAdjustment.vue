<template>
  <el-dialog
    v-model="visible"
    title="调整服务类型权限"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="adjustment-dialog">
      <div class="current-types">
        <h4>当前权限</h4>
        <div class="types-list">
          <el-tag
            v-for="type in currentTypes"
            :key="type"
            size="large"
            :color="getServiceTypeBgColor(type)"
            :style="{ color: getServiceTypeColor(type) }"
            class="type-tag"
            effect="dark"
          >
            <el-icon style="margin-right: 4px;">
              <component :is="getIconComponent(getServiceTypeIcon(type))" />
            </el-icon>
            {{ getServiceTypeLabel(type) }}
          </el-tag>
          <el-tag v-if="currentTypes.length === 0" type="info" size="large">无权限</el-tag>
        </div>
      </div>

      <el-divider />

      <div class="adjustment-section">
        <h4>添加权限</h4>
        <div class="available-types">
          <div
            v-for="type in availableTypes"
            :key="type"
            class="type-option"
            :class="{ selected: selectedToAdd.includes(type) }"
            @click="toggleAdd(type)"
          >
            <div
              class="type-icon"
              :style="{ backgroundColor: getServiceTypeBgColor(type), color: getServiceTypeColor(type) }"
            >
              <el-icon :size="20">
                <component :is="getIconComponent(getServiceTypeIcon(type))" />
              </el-icon>
            </div>
            <div class="type-info">
              <div class="type-name">{{ getServiceTypeLabel(type) }}</div>
              <div class="type-desc">{{ getServiceTypeDescription(type) }}</div>
            </div>
            <el-icon v-if="selectedToAdd.includes(type)" class="check-icon" color="#67c23a">
              <CircleCheck />
            </el-icon>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="adjustment-section">
        <h4>移除权限</h4>
        <div class="removable-types">
          <div
            v-for="type in currentTypes"
            :key="type"
            class="type-option danger"
            :class="{ selected: selectedToRemove.includes(type) }"
            @click="toggleRemove(type)"
          >
            <div
              class="type-icon"
              :style="{ backgroundColor: getServiceTypeBgColor(type), color: getServiceTypeColor(type) }"
            >
              <el-icon :size="20">
                <component :is="getIconComponent(getServiceTypeIcon(type))" />
              </el-icon>
            </div>
            <div class="type-info">
              <div class="type-name">{{ getServiceTypeLabel(type) }}</div>
              <div class="type-desc">{{ getServiceTypeDescription(type) }}</div>
            </div>
            <el-icon v-if="selectedToRemove.includes(type)" class="check-icon" color="#f56c6c">
              <CircleClose />
            </el-icon>
          </div>
          <el-empty v-if="currentTypes.length === 0" description="没有可移除的权限" />
        </div>
      </div>

      <el-divider />

      <div class="adjustment-summary">
        <h4>变更预览</h4>
        <div class="summary-content">
          <div v-if="selectedToAdd.length > 0" class="summary-item add">
            <span class="label">添加:</span>
            <el-tag
              v-for="type in selectedToAdd"
              :key="type"
              size="small"
              type="success"
              effect="dark"
              class="summary-tag"
            >
              {{ getServiceTypeLabel(type) }}
            </el-tag>
          </div>
          <div v-if="selectedToRemove.length > 0" class="summary-item remove">
            <span class="label">移除:</span>
            <el-tag
              v-for="type in selectedToRemove"
              :key="type"
              size="small"
              type="danger"
              effect="dark"
              class="summary-tag"
            >
              {{ getServiceTypeLabel(type) }}
            </el-tag>
          </div>
          <div v-if="selectedToAdd.length === 0 && selectedToRemove.length === 0" class="no-change">
            暂无变更
          </div>
        </div>
      </div>

      <el-form :model="formData" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="变更原因">
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入变更原因（可选）"
          />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker
            v-model="formData.expireAt"
            type="datetime"
            placeholder="选择到期时间（可选）"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
        :disabled="selectedToAdd.length === 0 && selectedToRemove.length === 0"
      >
        确认调整
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  getServiceTypeBgColor,
  getServiceTypeIcon,
  ServiceTypeMeta,
} from '@shared/constants/service-type.mjs';
import { getIconComponent } from '@utils/icon-map';

const props = defineProps<{
  modelValue: boolean;
  userId: string;
  currentTypes: ServiceType[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: { added: ServiceType[]; removed: ServiceType[]; reason?: string; expireAt?: Date }];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const allTypes = getAllServiceTypes();
const selectedToAdd = ref<ServiceType[]>([]);
const selectedToRemove = ref<ServiceType[]>([]);
const submitting = ref(false);

const formData = ref({
  reason: '',
  expireAt: undefined as Date | undefined,
});

const availableTypes = computed(() => {
  return allTypes.filter((type) => !props.currentTypes.includes(type));
});

const getServiceTypeDescription = (type: ServiceType): string => {
  return ServiceTypeMeta[type]?.description || '';
};

const toggleAdd = (type: ServiceType) => {
  const index = selectedToAdd.value.indexOf(type);
  if (index > -1) {
    selectedToAdd.value.splice(index, 1);
  } else {
    selectedToAdd.value.push(type);
  }
};

const toggleRemove = (type: ServiceType) => {
  const index = selectedToRemove.value.indexOf(type);
  if (index > -1) {
    selectedToRemove.value.splice(index, 1);
  } else {
    selectedToRemove.value.push(type);
  }
};

const handleSubmit = async () => {
  if (selectedToAdd.value.length === 0 && selectedToRemove.value.length === 0) {
    ElMessage.warning('请至少选择一个变更');
    return;
  }

  submitting.value = true;
  try {
    emit('submit', {
      added: [...selectedToAdd.value],
      removed: [...selectedToRemove.value],
      reason: formData.value.reason || undefined,
      expireAt: formData.value.expireAt,
    });

    // Reset
    selectedToAdd.value = [];
    selectedToRemove.value = [];
    formData.value = { reason: '', expireAt: undefined };
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.adjustment-dialog {
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;
  }

  .current-types {
    .types-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .type-tag {
        margin-right: 0;
      }
    }
  }

  .adjustment-section {
    .available-types,
    .removable-types {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .type-option {
      display: flex;
      align-items: center;
      padding: 12px;
      border: 2px solid #dcdfe6;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #409eff;
        background-color: #f5f7fa;
      }

      &.selected {
        border-color: #67c23a;
        background-color: #f0f9ff;
      }

      &.danger {
        &:hover {
          border-color: #f56c6c;
        }

        &.selected {
          border-color: #f56c6c;
          background-color: #fef0f0;
        }
      }

      .type-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }

      .type-info {
        flex: 1;

        .type-name {
          font-weight: 600;
          color: #303133;
        }

        .type-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }

      .check-icon {
        font-size: 20px;
      }
    }
  }

  .adjustment-summary {
    .summary-content {
      .summary-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          width: 50px;
          font-weight: 600;
        }

        &.add .label {
          color: #67c23a;
        }

        &.remove .label {
          color: #f56c6c;
        }

        .summary-tag {
          margin-right: 8px;
        }
      }

      .no-change {
        color: #909399;
        text-align: center;
        padding: 12px;
      }
    }
  }
}
</style>
