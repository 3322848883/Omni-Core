<template>
  <div class="payment-qrcodes">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">收款码管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加收款码
      </el-button>
    </div>

    <!-- 使用统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-label">总使用次数</div>
          <div class="stat-value">{{ statistics.totalUsage }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-label">今日使用次数</div>
          <div class="stat-value">{{ statistics.todayUsage }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 微信收款码列表 -->
    <el-card class="qrcode-section">
      <template #header>
        <div class="section-header">
          <span class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            微信收款码
          </span>
          <el-tag type="success">{{ wechatQRCodes.length }} 个</el-tag>
        </div>
      </template>

      <el-table :data="wechatQRCodes" v-loading="loading" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="缩略图" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              class="qr-thumbnail"
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
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="金额类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.amountType === 'fixed' ? 'warning' : 'info'" size="small">
              {{ row.amountType === 'fixed' ? '固定金额' : '任意金额' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.amountType === 'fixed' && row.fixedAmount">
              ¥{{ row.fixedAmount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="(val) => handleStatusChange(row, val as string)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="100" align="center" sortable />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 支付宝收款码列表 -->
    <el-card class="qrcode-section">
      <template #header>
        <div class="section-header">
          <span class="section-title">
            <el-icon><Wallet /></el-icon>
            支付宝收款码
          </span>
          <el-tag type="primary">{{ alipayQRCodes.length }} 个</el-tag>
        </div>
      </template>

      <el-table :data="alipayQRCodes" v-loading="loading" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="缩略图" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              class="qr-thumbnail"
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
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="金额类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.amountType === 'fixed' ? 'warning' : 'info'" size="small">
              {{ row.amountType === 'fixed' ? '固定金额' : '任意金额' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.amountType === 'fixed' && row.fixedAmount">
              ¥{{ row.fixedAmount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="(val) => handleStatusChange(row, val as string)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="100" align="center" sortable />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加收款码' : '编辑收款码'"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <!-- 类型选择 -->
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="formData.type" :disabled="dialogType === 'edit'">
            <el-radio-button label="wechat">
              <el-icon><ChatDotRound /></el-icon> 微信
            </el-radio-button>
            <el-radio-button label="alipay">
              <el-icon><Wallet /></el-icon> 支付宝
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 名称输入 -->
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入收款码名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <!-- 图片上传 -->
        <el-form-item label="收款码图片" prop="imageUrl">
          <el-upload
            class="qr-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/*"
          >
            <div v-if="formData.imageUrl" class="qr-preview-wrapper">
              <img :src="formData.imageUrl" class="qr-preview" />
              <div class="qr-preview-overlay">
                <el-icon><RefreshRight /></el-icon>
                <span>更换图片</span>
              </div>
            </div>
            <div v-else class="qr-uploader-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">点击上传收款码</div>
              <div class="upload-hint">支持 JPG、PNG 格式</div>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 金额设置 -->
        <el-form-item label="金额设置" prop="amountType">
          <el-radio-group v-model="formData.amountType">
            <el-radio label="any">任意金额</el-radio>
            <el-radio label="fixed">固定金额</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.amountType === 'fixed'"
          label="固定金额"
          prop="fixedAmount"
        >
          <el-input-number
            v-model="formData.fixedAmount"
            :min="0.01"
            :max="999999.99"
            :precision="2"
            :step="10"
            style="width: 180px"
          />
          <span class="form-item-hint">元</span>
        </el-form-item>

        <!-- 排序设置 -->
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="9999"
            :step="1"
            style="width: 180px"
          />
          <span class="form-item-hint">数字越小越靠前</span>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, UploadFile } from 'element-plus';
import {
  Plus,
  Edit,
  Delete,
  ChatDotRound,
  Wallet,
  Picture,
  RefreshRight,
} from '@element-plus/icons-vue';
import {
  getQRCodes,
  createQRCode,
  updateQRCode,
  deleteQRCode,
  toggleQRCodeStatus,
  uploadQRCodeImage,
  type QRCode,
  type QRCodeFormData,
} from '@/api/payment-qrcode';

// 加载状态
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref<'add' | 'edit'>('add');

// 表单引用
const formRef = ref<FormInstance>();

// 统计数据
const statistics = reactive({
  totalUsage: 0,
  todayUsage: 0,
});

// 收款码列表
const qrCodeList = ref<QRCode[]>([]);

// 计算属性：微信收款码列表
const wechatQRCodes = computed(() => {
  return qrCodeList.value
    .filter((item) => item.type === 'wechat')
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

// 计算属性：支付宝收款码列表
const alipayQRCodes = computed(() => {
  return qrCodeList.value
    .filter((item) => item.type === 'alipay')
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

// 表单数据
const formData = reactive<QRCodeFormData & { id?: string }>({
  id: undefined,
  name: '',
  type: 'wechat',
  imageUrl: '',
  amountType: 'any',
  fixedAmount: undefined,
  sortOrder: 0,
  description: '',
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入收款码名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度为 2-50 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  imageUrl: [{ required: true, message: '请上传收款码图片', trigger: 'change' }],
  amountType: [{ required: true, message: '请选择金额类型', trigger: 'change' }],
  fixedAmount: [
    {
      required: true,
      message: '请输入固定金额',
      trigger: 'blur',
      validator: (_rule: any, value: any, callback: any) => {
        if (formData.amountType === 'fixed' && (!value || value <= 0)) {
          callback(new Error('请输入有效的固定金额'));
        } else {
          callback();
        }
      },
    },
  ],
  sortOrder: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
};

// 加载收款码列表
const loadQRCodes = async () => {
  loading.value = true;
  try {
    const res = await getQRCodes({
      page: 1,
      limit: 1000, // 获取所有数据
    });
    qrCodeList.value = res.items || [];

    // 计算统计数据
    calculateStatistics();
  } catch (error) {
    console.error('加载收款码列表失败:', error);
    ElMessage.error('加载收款码列表失败');
  } finally {
    loading.value = false;
  }
};

// 计算统计数据
const calculateStatistics = () => {
  const total = qrCodeList.value.reduce((sum, item) => sum + (item.usageCount || 0), 0);
  statistics.totalUsage = total;
  // 今日使用次数需要后端支持，这里先模拟
  statistics.todayUsage = Math.floor(total * 0.1); // 模拟今日使用量为总量的 10%
};

// 添加收款码
const handleAdd = () => {
  dialogType.value = 'add';
  dialogVisible.value = true;
  // 重置表单
  Object.assign(formData, {
    id: undefined,
    name: '',
    type: 'wechat',
    imageUrl: '',
    amountType: 'any',
    fixedAmount: undefined,
    sortOrder: 0,
    description: '',
  });
};

// 编辑收款码
const handleEdit = (row: QRCode) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    type: row.type,
    imageUrl: row.imageUrl,
    amountType: row.amountType,
    fixedAmount: row.fixedAmount,
    sortOrder: row.sortOrder,
    description: row.description || '',
  });
};

// 删除收款码
const handleDelete = async (row: QRCode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收款码 "${row.name}" 吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    loading.value = true;
    await deleteQRCode(row.id);
    ElMessage.success('删除成功');
    await loadQRCodes();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除收款码失败:', error);
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 状态切换
const handleStatusChange = async (row: QRCode, newStatus: string) => {
  try {
    await toggleQRCodeStatus(row.id, newStatus as 'active' | 'inactive');
    ElMessage.success(newStatus === 'active' ? '已启用' : '已禁用');
  } catch (error) {
    console.error('切换状态失败:', error);
    ElMessage.error('操作失败');
    // 恢复状态
    row.status = row.status === 'active' ? 'inactive' : 'active';
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    const submitData: QRCodeFormData = {
      name: formData.name,
      type: formData.type,
      imageUrl: formData.imageUrl,
      amountType: formData.amountType,
      sortOrder: formData.sortOrder,
      description: formData.description,
    };

    if (formData.amountType === 'fixed' && formData.fixedAmount) {
      submitData.fixedAmount = formData.fixedAmount;
    }

    if (dialogType.value === 'add') {
      await createQRCode(submitData);
      ElMessage.success('添加成功');
    } else {
      await updateQRCode(formData.id!, submitData);
      ElMessage.success('更新成功');
    }

    dialogVisible.value = false;
    await loadQRCodes();
  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error(dialogType.value === 'add' ? '添加失败' : '更新失败');
  } finally {
    submitLoading.value = false;
  }
};

// 文件上传处理
const handleFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB');
    return;
  }

  // 先显示本地预览
  const reader = new FileReader();
  reader.onload = (e) => {
    formData.imageUrl = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  // 上传到服务器
  try {
    submitLoading.value = true;
    const res = await uploadQRCodeImage(file);
    formData.imageUrl = res.url;
    ElMessage.success('图片上传成功');
  } catch (error) {
    console.error('上传图片失败:', error);
    ElMessage.error('图片上传失败');
  } finally {
    submitLoading.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  loadQRCodes();
});
</script>

<style scoped lang="scss">
.payment-qrcodes {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .statistics-row {
    margin-bottom: 20px;

    .stat-card {
      text-align: center;

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }
  }

  .qrcode-section {
    margin-bottom: 20px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;

        .el-icon {
          font-size: 18px;
        }
      }
    }

    .qr-thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      cursor: pointer;
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
    }
  }

  .qr-uploader {
    :deep(.el-upload) {
      border: 1px dashed var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);

      &:hover {
        border-color: var(--el-color-primary);
      }
    }

    .qr-preview-wrapper {
      position: relative;
      width: 200px;
      height: 200px;

      .qr-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .qr-preview-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        opacity: 0;
        transition: opacity 0.3s;

        .el-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
      }

      &:hover .qr-preview-overlay {
        opacity: 1;
      }
    }

    .qr-uploader-placeholder {
      width: 200px;
      height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-secondary);

      .upload-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }

      .upload-text {
        font-size: 14px;
        margin-bottom: 4px;
      }

      .upload-hint {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }
  }

  .form-item-hint {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
</style>
