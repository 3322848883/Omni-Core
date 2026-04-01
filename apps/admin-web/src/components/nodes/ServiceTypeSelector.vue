<template>
  <div class="service-type-selector">
    <el-radio-group v-model="selectedType" @change="handleChange">
      <el-radio-button
        v-for="type in serviceTypes"
        :key="type"
        :label="type"
        class="type-radio-button"
      >
        <div class="radio-content">
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
        </div>
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  modelValue: ServiceType;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: ServiceType];
  change: [value: ServiceType];
}>();

const serviceTypes = getAllServiceTypes();

const selectedType = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const getServiceTypeDescription = (type: ServiceType): string => {
  return ServiceTypeMeta[type]?.description || '';
};

const handleChange = (val: ServiceType) => {
  emit('change', val);
};
</script>

<style scoped lang="scss">
.service-type-selector {
  .el-radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .type-radio-button {
    margin-right: 0;

    :deep(.el-radio-button__inner) {
      padding: 12px 16px;
      height: auto;
    }

    .radio-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .type-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .type-info {
        text-align: left;

        .type-name {
          font-weight: 600;
          font-size: 14px;
          color: #303133;
        }

        .type-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
