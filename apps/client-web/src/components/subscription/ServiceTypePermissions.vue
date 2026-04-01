<template>
  <div class="service-type-permissions">
    <h4 class="section-title">
      <el-icon><Key /></el-icon>
      服务类型权限
    </h4>

    <div class="permissions-list">
      <div
        v-for="type in serviceTypeList"
        :key="type.type"
        class="permission-item"
        :class="{ granted: hasPermission(type.type), denied: !hasPermission(type.type) }"
      >
        <div
          class="permission-icon"
          :style="{
            backgroundColor: hasPermission(type.type) ? type.bgColor : '#f5f7fa',
            color: hasPermission(type.type) ? type.color : '#c0c4cc'
          }"
        >
          <el-icon v-if="type.icon === 'plane'"><Promotion /></el-icon>
          <el-icon v-else-if="type.icon === 'crown'"><Medal /></el-icon>
          <el-icon v-else-if="type.icon === 'shield'"><Lock /></el-icon>
          <el-icon v-else-if="type.icon === 'home'"><HomeFilled /></el-icon>
          <el-icon v-else><CircleCheck /></el-icon>
        </div>

        <div class="permission-content">
          <div class="permission-header">
            <span class="permission-name" :style="{ color: hasPermission(type.type) ? type.color : '#c0c4cc' }">
              {{ type.label }}
            </span>
            <el-tag
              :type="hasPermission(type.type) ? 'success' : 'info'"
              size="small"
              effect="light"
            >
              <el-icon v-if="hasPermission(type.type)"><Check /></el-icon>
              <el-icon v-else><Lock /></el-icon>
              {{ hasPermission(type.type) ? '已授权' : '未授权' }}
            </el-tag>
          </div>
          <p class="permission-desc" :class="{ disabled: !hasPermission(type.type) }">
            {{ type.description }}
          </p>
          <div v-if="hasPermission(type.type) && accessibleNodes[type.type]" class="permission-stats">
            <el-icon><OfficeBuilding /></el-icon>
            <span>可访问 {{ accessibleNodes[type.type] }} 个节点</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 升级提示 -->
    <div v-if="hasDeniedPermissions" class="upgrade-hint">
      <el-alert
        title="升级套餐解锁更多服务类型"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>升级后可访问更多高质量节点，享受更优质的网络体验。</p>
          <el-button type="primary" size="small" @click="$emit('upgrade')">
            查看升级选项
          </el-button>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Key,
  Promotion,
  Medal,
  Lock,
  CircleCheck,
  Check,
  OfficeBuilding,
  HomeFilled
} from '@element-plus/icons-vue';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';

interface Props {
  effectiveServiceTypes: ServiceType[];
  accessibleNodes?: Record<ServiceType, number>;
}

const props = withDefaults(defineProps<Props>(), {
  accessibleNodes: () => ({
    [ServiceType.STANDARD]: 0,
    [ServiceType.DEDICATED_LINE]: 0,
    [ServiceType.EXCLUSIVE]: 0,
    [ServiceType.STATIC_RESIDENTIAL]: 0
  })
});

defineEmits<{
  upgrade: [];
}>();

const serviceTypeList = computed(() => {
  return Object.entries(ServiceTypeMeta).map(([type, meta]) => ({
    type: type as ServiceType,
    ...meta
  })).sort((a, b) => b.priority - a.priority);
});

const hasPermission = (type: ServiceType): boolean => {
  return props.effectiveServiceTypes.includes(type);
};

const hasDeniedPermissions = computed(() => {
  return serviceTypeList.value.some(type => !hasPermission(type.type));
});
</script>

<style scoped lang="scss">
.service-type-permissions {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;

    .el-icon {
      color: #409eff;
    }
  }

  .permissions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .permission-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid #e4e7ed;
    transition: all 0.3s ease;

    &.granted {
      background: #fafafa;
      border-color: #dcdfe6;
    }

    &.denied {
      background: #f5f7fa;
      border-color: #e4e7ed;
      opacity: 0.8;
    }

    .permission-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.3s ease;

      .el-icon {
        font-size: 20px;
      }
    }

    .permission-content {
      flex: 1;

      .permission-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;

        .permission-name {
          font-size: 15px;
          font-weight: 600;
        }
      }

      .permission-desc {
        font-size: 13px;
        color: #606266;
        line-height: 1.5;
        margin: 0;

        &.disabled {
          color: #909399;
        }
      }

      .permission-stats {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        font-size: 12px;
        color: #409eff;
        font-weight: 500;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }

  .upgrade-hint {
    margin-top: 20px;

    :deep(.el-alert__content) {
      flex: 1;
    }

    p {
      margin: 8px 0;
      font-size: 13px;
    }
  }
}
</style>
