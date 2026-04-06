<template>
  <div class="qrcode-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <span>收款码管理</span>
            <el-tag type="info" size="small" class="count-tag">
              共 {{ total }} 个
            </el-tag>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            添加收款码
          </el-button>
        </div>
      </template>

      <!-- Filters -->
      <el-form :model="queryForm" inline class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="收款码名称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryForm.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option label="微信支付" value="wechat">
              <el-icon><Wallet /></el-icon>
              <span style="margin-left: 4px">微信支付</span>
            </el-option>
            <el-option label="支付宝" value="alipay">
              <el-icon><Money /></el-icon>
              <span style="margin-left: 4px">支付宝</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="启用" value="active">
              <el-tag type="success" size="small">启用</el-tag>
            </el-option>
            <el-option label="禁用" value="inactive">
              <el-tag type="info" size="small">禁用</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table
        :data="qrcodeList"
        v-loading="loading"
        stripe
        border
        class="qrcode-table"
      >
        <el-table-column label="收款码" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              class="qrcode-thumbnail"
              :preview-teleported="true"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="名称" min-width="150">
          <template #default="{ row }">
            <div class="name-cell">
              <span class="name-text">{{ row.name }}</span>
              <el-tag
                v-if="row.description"
                type="info"
                size="small"
                class="desc-tag"
              >
                {{ row.description }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'wechat' ? 'success' : 'primary'"
              size="small"
              effect="light"
            >
              <el-icon v-if="row.type === 'wechat'"><Wallet /></el-icon>
              <el-icon v-else><Money /></el-icon>
              <span style="margin-left: 4px">
                {{ row.type === 'wechat' ? '微信支付' : '支付宝' }}
              </span>
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="金额设置" width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.amountType === 'fixed'" class="amount-cell">
              <span class="fixed-amount">¥{{ row.fixedAmount }}</span>
              <el-tag type="warning" size="small">固定</el-tag>
            </div>
            <div v-else class="amount-cell">
              <span class="any-amount">任意金额</span>
              <el-tag type="info" size="small">自定义</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="usageCount" label="使用次数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">
              {{ row.usageCount || 0 }} 次
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sortOrder" label="排序" width="80" align="center">
          <template #default="{ row }">
            <span class="sort-order">{{ row.sortOrder }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="(val: string) => handleToggleStatus(row, val as QRCodeStatus)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Form Dialog -->
    <QRCodeFormDialog
      v-model:visible="dialogVisible"
      :qrcode="currentQRCode"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  Picture,
  Wallet,
  Money,
} from '@element-plus/icons-vue';
import {
  getQRCodes,
  deleteQRCode,
  toggleQRCodeStatus,
  type QRCode,
  type QRCodeStatus,
  type QRCodeQuery,
} from '@/api/payment-qrcode';
import QRCodeFormDialog from './QRCodeFormDialog.vue';

// 状态
const loading = ref(false);
const qrcodeList = ref<QRCode[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const currentQRCode = ref<QRCode | undefined>(undefined);

// 查询表单
const queryForm = reactive<QRCodeQuery>({
  page: 1,
  limit: 20,
  keyword: '',
  type: undefined,
  status: undefined,
});

// 获取列表数据
const fetchQRCodes = async () => {
  loading.value = true;
  try {
    const res = await getQRCodes(queryForm);
    qrcodeList.value = res.items;
    total.value = res.pagination.total;
  } catch (error) {
    console.error('Failed to fetch QR codes:', error);
    ElMessage.error('获取收款码列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  queryForm.page = 1;
  fetchQRCodes();
};

// 重置
const handleReset = () => {
  queryForm.page = 1;
  queryForm.keyword = '';
  queryForm.type = undefined;
  queryForm.status = undefined;
  fetchQRCodes();
};

// 创建
const handleCreate = () => {
  currentQRCode.value = undefined;
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: QRCode) => {
  currentQRCode.value = row;
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row: QRCode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收款码 "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await deleteQRCode(row.id);
    ElMessage.success('删除成功');
    fetchQRCodes();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete QR code:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 切换状态
const handleToggleStatus = async (row: QRCode, status: QRCodeStatus) => {
  try {
    await toggleQRCodeStatus(row.id, status);
    ElMessage.success(status === 'active' ? '已启用' : '已禁用');
  } catch (error) {
    console.error('Failed to toggle status:', error);
    // 恢复原状态
    row.status = status === 'active' ? 'inactive' : 'active';
    ElMessage.error('操作失败');
  }
};

// 分页大小变化
const handleSizeChange = (size: number) => {
  queryForm.limit = size;
  fetchQRCodes();
};

// 页码变化
const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchQRCodes();
};

// 表单提交成功
const handleFormSuccess = () => {
  dialogVisible.value = false;
  fetchQRCodes();
};

// 初始化
onMounted(() => {
  fetchQRCodes();
});
</script>

<style scoped lang="scss">
.qrcode-management {
  padding: 20px;
  min-height: calc(100vh - 120px);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;

      span {
        font-size: 16px;
        font-weight: 600;
      }

      .count-tag {
        font-weight: normal;
      }
    }
  }

  .filter-form {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .qrcode-table {
    .qrcode-thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color);
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.05);
      }
    }

    .image-error {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--el-fill-color-light);
      border-radius: 4px;
      color: var(--el-text-color-secondary);
      font-size: 24px;
    }

    .name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name-text {
        font-weight: 500;
      }

      .desc-tag {
        align-self: flex-start;
      }
    }

    .amount-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .fixed-amount {
        font-weight: 600;
        color: var(--el-color-danger);
        font-size: 16px;
      }

      .any-amount {
        color: var(--el-text-color-secondary);
      }
    }

    .sort-order {
      font-weight: 600;
      color: var(--el-text-color-secondary);
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 响应式布局
@media screen and (max-width: 768px) {
  .qrcode-management {
    padding: 10px;

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 10px;
        margin-right: 0;
        width: 100%;

        .el-input,
        .el-select {
          width: 100% !important;
        }
      }
    }

    .qrcode-table {
      .qrcode-thumbnail,
      .image-error {
        width: 40px;
        height: 40px;
      }
    }
  }
}
</style>
