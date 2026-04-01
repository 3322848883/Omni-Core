<template>
  <div class="batch-actions">
    <div class="selection-info">
      <el-checkbox
        v-model="selectAll"
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >
        全选
      </el-checkbox>
      <span v-if="selectedCount > 0" class="selected-count">
        已选择 <strong>{{ selectedCount }}</strong> 个节点
      </span>
    </div>

    <div v-if="selectedCount > 0" class="action-buttons">
      <el-dropdown @command="handleBatchCommand" split-button type="primary">
        批量操作
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="changeServiceType">
              <el-icon><Switch /></el-icon>
              修改服务类型
            </el-dropdown-item>
            <el-dropdown-item command="enable">
              <el-icon><CircleCheck /></el-icon>
              批量启用
            </el-dropdown-item>
            <el-dropdown-item command="disable">
              <el-icon><CircleClose /></el-icon>
              批量禁用
            </el-dropdown-item>
            <el-dropdown-item divided command="delete" class="danger-item">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button @click="handleClearSelection">取消选择</el-button>
    </div>

    <!-- Change Service Type Dialog -->
    <el-dialog
      v-model="changeTypeDialogVisible"
      title="批量修改服务类型"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="dialog-content">
        <p class="dialog-tip">
          将为 <strong>{{ selectedCount }}</strong> 个节点修改服务类型
        </p>

        <el-form label-width="100px">
          <el-form-item label="新服务类型" required>
            <el-radio-group v-model="targetServiceType">
              <el-radio-button
                v-for="type in serviceTypes"
                :key="type"
                :label="type"
              >
                <div class="radio-content">
                  <span
                    class="type-dot"
                    :style="{ backgroundColor: getServiceTypeColor(type) }"
                  />
                  {{ getServiceTypeLabel(type) }}
                </div>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="同时修改QoS">
            <el-switch v-model="alsoChangeQos" />
          </el-form-item>

          <el-form-item v-if="alsoChangeQos" label="QoS等级">
            <el-slider
              v-model="targetQosLevel"
              :min="1"
              :max="5"
              :step="1"
              show-stops
              show-input
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="changeTypeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmChangeServiceType"
          :loading="submitting"
          :disabled="!targetServiceType"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Switch, CircleCheck, CircleClose, Delete } from '@element-plus/icons-vue';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
} from '@shared/constants/service-type.mjs';

const props = defineProps<{
  selectedIds: string[];
  totalCount: number;
}>();

const emit = defineEmits<{
  'update:selectedIds': [ids: string[]];
  'select-all': [selected: boolean];
  'batch-change-service-type': [data: { ids: string[]; serviceType: ServiceType; qosLevel?: number }];
  'batch-enable': [ids: string[]];
  'batch-disable': [ids: string[]];
  'batch-delete': [ids: string[]];
}>();

const serviceTypes = getAllServiceTypes();

const selectAll = ref(false);
const isIndeterminate = computed(() => {
  return props.selectedIds.length > 0 && props.selectedIds.length < props.totalCount;
});
const selectedCount = computed(() => props.selectedIds.length);

// Change service type dialog
const changeTypeDialogVisible = ref(false);
const targetServiceType = ref<ServiceType | undefined>(undefined);
const alsoChangeQos = ref(false);
const targetQosLevel = ref(3);
const submitting = ref(false);

const handleSelectAll = (val: boolean) => {
  emit('select-all', val);
};

const handleClearSelection = () => {
  emit('update:selectedIds', []);
  selectAll.value = false;
};

const handleBatchCommand = async (command: string) => {
  if (props.selectedIds.length === 0) {
    ElMessage.warning('请先选择节点');
    return;
  }

  switch (command) {
    case 'changeServiceType':
      targetServiceType.value = undefined;
      alsoChangeQos.value = false;
      changeTypeDialogVisible.value = true;
      break;
    case 'enable':
      await handleBatchEnable();
      break;
    case 'disable':
      await handleBatchDisable();
      break;
    case 'delete':
      await handleBatchDelete();
      break;
  }
};

const confirmChangeServiceType = async () => {
  if (!targetServiceType.value) {
    ElMessage.warning('请选择目标服务类型');
    return;
  }

  submitting.value = true;
  try {
    emit('batch-change-service-type', {
      ids: props.selectedIds,
      serviceType: targetServiceType.value,
      qosLevel: alsoChangeQos.value ? targetQosLevel.value : undefined,
    });
    changeTypeDialogVisible.value = false;
    handleClearSelection();
  } finally {
    submitting.value = false;
  }
};

const handleBatchEnable = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要启用选中的 ${props.selectedIds.length} 个节点吗？`,
      '确认启用',
      { type: 'warning' }
    );
    emit('batch-enable', props.selectedIds);
    handleClearSelection();
  } catch {
    // Cancelled
  }
};

const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要禁用选中的 ${props.selectedIds.length} 个节点吗？`,
      '确认禁用',
      { type: 'warning' }
    );
    emit('batch-disable', props.selectedIds);
    handleClearSelection();
  } catch {
    // Cancelled
  }
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedIds.length} 个节点吗？此操作不可恢复！`,
      '确认删除',
      { type: 'error' }
    );
    emit('batch-delete', props.selectedIds);
    handleClearSelection();
  } catch {
    // Cancelled
  }
};
</script>

<style scoped lang="scss">
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;

  .selection-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .selected-count {
      color: #606266;
      font-size: 14px;

      strong {
        color: #409eff;
        font-size: 16px;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
}

.dialog-content {
  .dialog-tip {
    margin-bottom: 20px;
    color: #606266;
    font-size: 14px;

    strong {
      color: #409eff;
    }
  }
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 6px;

  .type-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
}

.danger-item {
  color: #f56c6c;
}
</style>
