<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- User Info Card -->
      <el-col :xs="24" :lg="8">
        <el-card v-loading="userStore.loading" class="user-card glass-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">个人信息</span>
              <el-button type="primary" link @click="startEdit" class="edit-btn">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </template>

          <div class="user-info">
            <div class="avatar-section">
              <el-avatar
                :size="100"
                :src="userStore.currentUser?.avatar"
                class="user-avatar"
              >
                {{ getAvatarText() }}
              </el-avatar>
              <el-upload
                class="avatar-uploader"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarChange"
                accept="image/*"
              >
                <el-button type="primary" link size="small" class="upload-btn">
                  <el-icon><Camera /></el-icon>
                  更换头像
                </el-button>
              </el-upload>
            </div>

            <div class="info-list">
              <div class="info-item">
                <div class="info-label">
                  <el-icon><User /></el-icon>
                  用户名
                </div>
                <div class="info-value">{{ userStore.currentUser?.username }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <el-icon><Message /></el-icon>
                  邮箱
                </div>
                <div class="info-value">{{ userStore.currentUser?.email }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <el-icon><Medal /></el-icon>
                  角色
                </div>
                <div class="info-value">
                  <el-tag :type="getRoleType(userStore.currentUser?.role)" effect="dark" class="role-tag">
                    {{ getRoleText(userStore.currentUser?.role) }}
                  </el-tag>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <el-icon><CircleCheck /></el-icon>
                  账户状态
                </div>
                <div class="info-value">
                  <el-tag :type="getStatusType(userStore.currentUser?.status)" effect="dark" class="status-tag">
                    {{ getStatusText(userStore.currentUser?.status) }}
                  </el-tag>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <el-icon><Calendar /></el-icon>
                  注册时间
                </div>
                <div class="info-value">
                  {{ userStore.currentUser?.createdAt ? formatDate(userStore.currentUser.createdAt) : '-' }}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">
                  <el-icon><Clock /></el-icon>
                  最后登录
                </div>
                <div class="info-value">
                  {{ userStore.currentUser?.lastLoginAt ? formatDate(userStore.currentUser.lastLoginAt) : '-' }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Edit Profile & Password -->
      <el-col :xs="24" :lg="16">
        <!-- Edit Profile Card -->
        <el-card class="edit-card glass-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">编辑资料</span>
            </div>
          </template>

          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
            :disabled="!isEditing"
            class="profile-form"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" disabled />
            </el-form-item>
          </el-form>

          <div v-if="isEditing" class="form-actions">
            <el-button @click="cancelEdit" class="cancel-btn">取消</el-button>
            <el-button type="primary" :loading="saving" @click="saveProfile" class="save-btn">
              保存修改
            </el-button>
          </div>
        </el-card>

        <!-- Change Password Card -->
        <el-card class="password-card glass-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">修改密码</span>
            </div>
          </template>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            class="password-form"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
          </el-form>

          <div class="form-actions">
            <el-button @click="resetPasswordForm" class="reset-btn">重置</el-button>
            <el-button type="primary" :loading="changingPassword" @click="changePassword" class="save-btn">
              修改密码
            </el-button>
          </div>
        </el-card>

        <!-- Quick Links -->
        <el-card class="links-card glass-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">快捷入口</span>
            </div>
          </template>

          <div class="quick-links">
            <el-button size="large" @click="$router.push('/app/subscription')" class="link-btn">
              <el-icon><Ticket /></el-icon>
              我的订阅
            </el-button>
            <el-button size="large" @click="$router.push('/app/orders')" class="link-btn">
              <el-icon><Document /></el-icon>
              我的订单
            </el-button>
            <el-button size="large" @click="$router.push('/app/profile/settings')" class="link-btn">
              <el-icon><Setting /></el-icon>
              账户设置
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Edit, Camera, Ticket, Document, Setting, User, Message, Medal, CircleCheck, Calendar, Clock } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import * as userApi from '@/api/user';
import { formatDate } from '@/utils/format';

const userStore = useUserStore();

// Profile Edit
const isEditing = ref(false);
const saving = ref(false);
const profileFormRef = ref<FormInstance>();
const profileForm = reactive({
  username: '',
  email: '',
});

const profileRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为 3-20 个字符', trigger: 'blur' },
  ],
};

// Password Change
const changingPassword = ref(false);
const passwordFormRef = ref<FormInstance>();
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为 8 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

const getAvatarText = (): string => {
  const username = userStore.currentUser?.username;
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
};

const getRoleType = (role?: string): string => {
  const typeMap: Record<string, string> = {
    user: 'info',
    vip: 'warning',
    admin: 'danger',
  };
  return typeMap[role || 'user'] || 'info';
};

const getRoleText = (role?: string): string => {
  const textMap: Record<string, string> = {
    user: '普通用户',
    vip: 'VIP用户',
    admin: '管理员',
  };
  return textMap[role || 'user'] || '普通用户';
};

const getStatusType = (status?: string): string => {
  const typeMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    banned: 'danger',
  };
  return typeMap[status || 'inactive'] || 'info';
};

const getStatusText = (status?: string): string => {
  const textMap: Record<string, string> = {
    active: '正常',
    inactive: '未激活',
    banned: '已封禁',
  };
  return textMap[status || 'inactive'] || '未知';
};

const startEdit = () => {
  profileForm.username = userStore.currentUser?.username || '';
  profileForm.email = userStore.currentUser?.email || '';
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  profileFormRef.value?.resetFields();
};

const saveProfile = async () => {
  if (!profileFormRef.value) return;

  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      await userStore.updateUser({ username: profileForm.username });
      ElMessage.success('个人信息已更新');
      isEditing.value = false;
    } catch (error) {
      // Error handled in store
    } finally {
      saving.value = false;
    }
  });
};

const handleAvatarChange = async (file: { raw: File }) => {
  const rawFile = file.raw;
  if (!rawFile) return;

  // Validate file type
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // Validate file size (max 2MB)
  if (rawFile.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB');
    return;
  }

  try {
    await userApi.uploadAvatar(rawFile);
    await userStore.fetchUser();
    ElMessage.success('头像更新成功');
  } catch (error) {
    ElMessage.error('头像上传失败');
  }
};

const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields();
};

const changePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    changingPassword.value = true;
    try {
      await userStore.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      ElMessage.success('密码修改成功');
      resetPasswordForm();
    } catch (error) {
      // Error handled in store
    } finally {
      changingPassword.value = false;
    }
  });
};

onMounted(() => {
  userStore.fetchUser();
});
</script>

<style scoped lang="scss">
.profile-page {
  padding: var(--space-4);

  // 玻璃拟态卡片基础样式
  .glass-card {
    background: rgba(26, 26, 37, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-xl);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.05);
    transition: all 0.3s ease;
    overflow: hidden;

    &:hover {
      border-color: rgba(99, 102, 241, 0.2);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1);
    }

    :deep(.el-card__header) {
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: var(--space-5) var(--space-6);
    }

    :deep(.el-card__body) {
      padding: var(--space-6);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-2);

      &::before {
        content: '';
        width: 4px;
        height: 20px;
        background: var(--gradient-primary);
        border-radius: 2px;
      }
    }

    .edit-btn {
      color: var(--text-brand);
      font-weight: var(--font-medium);

      &:hover {
        color: var(--brand-primary);
      }
    }
  }

  // 用户信息卡片
  .user-card {
    margin-bottom: 20px;

    .user-info {
      .avatar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: var(--space-6);

        .user-avatar {
          font-size: 40px;
          margin-bottom: var(--space-3);
          background: var(--gradient-primary);
          box-shadow: var(--glow-primary);
          border: 3px solid rgba(255, 255, 255, 0.1);
        }

        .upload-btn {
          color: var(--text-brand);
          font-weight: var(--font-medium);

          &:hover {
            color: var(--brand-primary);
          }
        }
      }

      .info-list {
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);

          &:last-child {
            border-bottom: none;
          }

          .info-label {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--text-tertiary);
            font-size: var(--text-sm);

            .el-icon {
              font-size: 16px;
              color: var(--text-muted);
            }
          }

          .info-value {
            color: var(--text-primary);
            font-weight: var(--font-medium);
            font-size: var(--text-sm);
          }

          .role-tag,
          .status-tag {
            border-radius: var(--radius-full);
            font-weight: var(--font-medium);
          }
        }
      }
    }
  }

  // 编辑卡片
  .edit-card,
  .password-card,
  .links-card {
    margin-bottom: 20px;

    .profile-form,
    .password-form {
      :deep(.el-form-item__label) {
        color: var(--text-secondary);
        font-weight: var(--font-medium);
      }

      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: none;

        &:hover {
          border-color: rgba(99, 102, 241, 0.3);
        }

        &.is-focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
      }

      :deep(.el-input__inner) {
        color: var(--text-primary);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-5);
      padding-top: var(--space-4);
      border-top: 1px solid rgba(255, 255, 255, 0.06);

      .cancel-btn,
      .reset-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
        }
      }

      .save-btn {
        background: var(--gradient-primary);
        border: none;
        box-shadow: var(--shadow-button);

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-button-hover);
        }
      }
    }
  }

  // 快捷入口
  .quick-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);

    .link-btn {
      flex: 1;
      min-width: 140px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
      transition: all 0.3s ease;

      .el-icon {
        margin-right: var(--space-2);
        color: var(--text-brand);
      }

      &:hover {
        background: rgba(99, 102, 241, 0.1);
        border-color: rgba(99, 102, 241, 0.3);
        color: var(--text-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .profile-page {
    padding: var(--space-3);

    .quick-links {
      .link-btn {
        min-width: 100%;
      }
    }
  }
}
</style>
