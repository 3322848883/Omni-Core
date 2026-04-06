<template>
  <el-dialog
    :title="isEdit ? '编辑收款码' : '添加收款码'"
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    class="qrcode-form-dialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="qrcode-form"
    >
      <!-- 图片上传 -->
      <el-form-item label="收款码图片" prop="imageUrl">
        <div class="upload-wrapper">
          <el-upload
            class="qrcode-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            accept="image/*"
          >
            <div v-if="formData.imageUrl" class="image-preview">
              <el-image
                :src="formData.imageUrl"
                fit="cover"
                class="preview-img"
              />
              <div class="image-overlay">
                <el-icon><Refresh /></el-icon>
                <span>更换图片</span>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">
                <span>点击上传收款码</span>
                <span class="upload-hint">支持 JPG、PNG 格式</span>
              </div>
            </div>
          </el-upload>
          <div v-if="formData.imageUrl" class="image-actions">
            <el-button type="danger" link @click="handleRemoveImage">
              <el-icon><Delete /></el-icon>
              删除图片
            </el-button>
          </div>
        </div>
      </el-form-item>

      <!-- 名称 -->
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入收款码名称，如：微信支付-客服1"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <!-- 类型 -->
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type" size="large">
          <el-radio-button label="wechat">
            <el-icon><Wallet /></el-icon>
            <span>微信支付</span>
          </el-radio-button>
          <el-radio-button label="alipay">
            <el-icon><Money /></el-icon>
            <span>支付宝</span>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 金额类型 -->
      <el-form-item label="金额类型" prop="amountType">
        <el-radio-group v-model="formData.amountType">
          <el-radio label="fixed">固定金额</el-radio>
          <el-radio label="any">任意金额</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 固定金额 -->
      <el-form-item
        v-if="formData.amountType === 'fixed'"
        label="固定金额"
        prop="fixedAmount"
      >
        <el-input-number
          v-model="formData.fixedAmount"
          :min="0.01"
          :max="999999"
          :precision="2"
          :step="10"
          controls-position="right"
          style="width: 200px"
        >
          <template #prefix>
            <span>¥</span>
          </template>
        </el-input-number>
      </el-form-item>

      <!-- 金额范围（任意金额时） -->
      <template v-if="formData.amountType === 'any'">
        <el-form-item label="最小金额" prop="minAmount">
          <el-input-number
            v-model="formData.minAmount"
            :min="0.01"
            :max="999999"
            :precision="2"
            :step="10"
            controls-position="right"
            placeholder="可选"
            style="width: 200px"
          >
            <template #prefix>
              <span>¥</span>
            </template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="最大金额" prop="maxAmount">
          <el-input-number
            v-model="formData.maxAmount"
            :min="0.01"
            :max="999999"
            :precision="2"
            :step="10"
            controls-position="right"
            placeholder="可选"
            style="width: 200px"
          >
            <template #prefix>
              <span>¥</span>
            </template>
          </el-input-number>
        </el-form-item>
      </template>

      <!-- 排序 -->
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number
          v-model="formData.sortOrder"
          :min="0"
          :max="9999"
          :step="1"
          controls-position="right"
          style="width: 150px"
        />
        <span class="form-hint">数字越小，排序越靠前</span>
      </el-form-item>

      <!-- 描述 -->
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="可选：添加收款码的备注信息"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
  Plus,
  Delete,
  Refresh,
  Wallet,
  Money,
} from '@element-plus/icons-vue';
import {
  createQRCode,
  updateQRCode,
  uploadQRCodeImage,
  type QRCode,
  type QRCodeFormData,
  type QRCodeType,
  type AmountType,
} from '@/api/payment-qrcode';
import { useAuthStore } from '@/stores/auth';

// Props
interface Props {
  visible: boolean;
  qrcode?: QRCode;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

// 计算属性：对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// 计算属性：是否为编辑模式
const isEdit = computed(() => !!props.qrcode);

// Refs
const formRef = ref<FormInstance>();
const submitting = ref(false);
const uploading = ref(false);

// 上传配置
const authStore = useAuthStore();
const uploadAction = computed(() => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1/admin';
  return `${baseURL}/payment/qrcodes/upload`;
});
const uploadHeaders = computed(() => ({
  Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
}));

// 表单数据
const formData = reactive<QRCodeFormData>({
  name: '',
  type: 'wechat' as QRCodeType,
  imageUrl: '',
  amountType: 'fixed' as AmountType,
  fixedAmount: 100,
  minAmount: undefined,
  maxAmount: undefined,
  description: '',
  sortOrder: 0,
});

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入收款码名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择收款码类型', trigger: 'change' }],
  imageUrl: [{ required: true, message: '请上传收款码图片', trigger: 'change' }],
  amountType: [{ required: true, message: '请选择金额类型', trigger: 'change' }],
  fixedAmount: [
    {
      required: true,
      message: '请输入固定金额',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (formData.amountType === 'fixed' && (!value || value <= 0)) {
          callback(new Error('固定金额必须大于 0'));
        } else {
          callback();
        }
      },
    },
  ],
  sortOrder: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
};

// 监听编辑数据变化
watch(
  () => props.qrcode,
  (newVal) => {
    if (newVal) {
      // 编辑模式：填充数据
      formData.name = newVal.name;
      formData.type = newVal.type;
      formData.imageUrl = newVal.imageUrl;
      formData.amountType = newVal.amountType;
      formData.fixedAmount = newVal.fixedAmount || 100;
      formData.minAmount = newVal.minAmount;
      formData.maxAmount = newVal.maxAmount;
      formData.description = newVal.description || '';
      formData.sortOrder = newVal.sortOrder;
    } else {
      // 创建模式：重置表单
      resetForm();
    }
  },
  { immediate: true }
);

// 重置表单
const resetForm = () => {
  formData.name = '';
  formData.type = 'wechat';
  formData.imageUrl = '';
  formData.amountType = 'fixed';
  formData.fixedAmount = 100;
  formData.minAmount = undefined;
  formData.maxAmount = undefined;
  formData.description = '';
  formData.sortOrder = 0;
  formRef.value?.resetFields();
};

// 上传前验证
const handleBeforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！');
    return false;
  }

  uploading.value = true;
  return true;
};

// 上传成功
const handleUploadSuccess = (response: any) => {
  uploading.value = false;
  if (response.data?.url) {
    formData.imageUrl = response.data.url;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error('上传失败：未获取到图片地址');
  }
};

// 上传失败
const handleUploadError = () => {
  uploading.value = false;
  ElMessage.error('图片上传失败，请重试');
};

// 删除图片
const handleRemoveImage = () => {
  formData.imageUrl = '';
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      // 构造提交数据
      const submitData: QRCodeFormData = {
        name: formData.name,
        type: formData.type,
        imageUrl: formData.imageUrl,
        amountType: formData.amountType,
        sortOrder: formData.sortOrder,
        description: formData.description || undefined,
      };

      if (formData.amountType === 'fixed') {
        submitData.fixedAmount = formData.fixedAmount;
      } else {
        submitData.minAmount = formData.minAmount;
        submitData.maxAmount = formData.maxAmount;
      }

      if (isEdit.value && props.qrcode) {
        await updateQRCode(props.qrcode.id, submitData);
        ElMessage.success('收款码更新成功');
      } else {
        await createQRCode(submitData);
        ElMessage.success('收款码创建成功');
      }

      emit('success');
      dialogVisible.value = false;
    } catch (error) {
      console.error('Failed to save QR code:', error);
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
    } finally {
      submitting.value = false;
    }
  });
};
</script>

<style scoped lang="scss">
.qrcode-form-dialog {
  :deep(.el-dialog__body) {
    padding-top: 20px;
    padding-bottom: 10px;
  }
}

.qrcode-form {
  .upload-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .qrcode-uploader {
    :deep(.el-upload) {
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .upload-placeholder {
    width: 280px;
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);

    .upload-icon {
      font-size: 48px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--el-text-color-regular);

      .upload-hint {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .image-preview {
    width: 280px;
    height: 180px;
    position: relative;

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background-color: var(--el-fill-color-light);
    }

    .image-overlay {
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
      color: white;
      opacity: 0;
      transition: opacity 0.3s;

      .el-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
    }

    &:hover .image-overlay {
      opacity: 1;
    }
  }

  .image-actions {
    display: flex;
    gap: 8px;
  }

  .form-hint {
    margin-left: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  :deep(.el-radio-button__inner) {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;

    .el-icon {
      font-size: 16px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式布局
@media screen and (max-width: 768px) {
  .qrcode-form-dialog {
    :deep(.el-dialog) {
      width: 90% !important;
      margin: 0 auto;
    }

    :deep(.el-dialog__body) {
      padding: 15px;
    }
  }

  .qrcode-form {
    :deep(.el-form-item__label) {
      float: none;
      display: block;
      text-align: left;
      padding: 0 0 8px;
      line-height: 1.5;
    }

    :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }

    .upload-placeholder,
    .image-preview {
      width: 100%;
      max-width: 280px;
    }

    :deep(.el-radio-group) {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    :deep(.el-radio-button) {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>
