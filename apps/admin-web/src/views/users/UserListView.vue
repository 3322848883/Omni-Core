<template>
  <div class="user-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="handleCreate">新建用户</el-button>
        </div>
      </template>

      <!-- Create/Edit User Dialog -->
      <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑用户' : '新建用户'"
        width="600px"
        destroy-on-close
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="formData.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="密码" prop="password" v-if="!isEdit">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="流量限制" prop="trafficLimit">
            <el-input-number
              v-model="formData.trafficLimit"
              :min="0"
              :step="1"
              placeholder="GB"
            />
            <span class="unit">GB</span>
          </el-form-item>
          <el-form-item label="到期时间" prop="expireDate">
            <el-date-picker
              v-model="formData.expireDate"
              type="datetime"
              placeholder="选择到期时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">正常</el-radio>
              <el-radio :value="2">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </template>
      </el-dialog>

      <!-- Search Form -->
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="用户名/邮箱/UUID" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="2" />
            <el-option label="已删除" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="vpnUuid" label="VPN UUID" width="280" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="trafficUsed" label="已用流量" width="120">
          <template #default="{ row }">
            {{ formatTraffic(row.trafficUsed) }}
          </template>
        </el-table-column>
        <el-table-column prop="expireDate" label="到期时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              :type="row.status === 2 ? 'success' : 'danger'" 
              link 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 2 ? '启用' : '禁用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUsers, banUser, unbanUser, createUser, updateUser } from '@api/users';
import type { User, UserQuery } from '../../types/user';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const userList = ref<User[]>([]);
const total = ref(0);

// Dialog related
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const currentUserId = ref('');

const formData = reactive({
  username: '',
  email: '',
  password: '',
  trafficLimit: 0,
  expireDate: '',
  status: 1,
});

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
};

const queryForm = reactive<UserQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await getUsers(queryForm);
    userList.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'danger',
    3: 'info',
  };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '正常',
    2: '禁用',
    3: '已删除',
  };
  return map[status] || '未知';
};

const formatTraffic = (bytes: number) => {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchUsers();
};

const handleReset = () => {
  queryForm.keyword = '';
  queryForm.status = undefined;
  queryForm.page = 1;
  fetchUsers();
};

const resetForm = () => {
  formData.username = '';
  formData.email = '';
  formData.password = '';
  formData.trafficLimit = 0;
  formData.expireDate = '';
  formData.status = 1;
};

const handleCreate = () => {
  isEdit.value = false;
  currentUserId.value = '';
  resetForm();
  dialogVisible.value = true;
};

const handleView = (row: User) => {
  router.push(`/users/${row.id}/subscriptions`);
};

const handleEdit = (row: User) => {
  isEdit.value = true;
  currentUserId.value = row.id;
  formData.username = row.username;
  formData.email = row.email;
  formData.trafficLimit = row.trafficLimit || 0;
  formData.expireDate = row.expireDate;
  formData.status = row.status;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    submitLoading.value = true;
    const submitData = {
      ...formData,
      trafficLimit: formData.trafficLimit * 1024 * 1024 * 1024, // Convert GB to bytes
    };

    if (isEdit.value) {
      await updateUser(currentUserId.value, submitData);
      ElMessage.success('用户更新成功');
    } else {
      await createUser(submitData);
      ElMessage.success('用户创建成功');
    }

    dialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    // Validation failed or API error - handled by request interceptor
    console.error('Submit error:', error);
  } finally {
    submitLoading.value = false;
  }
};

const handleToggleStatus = async (row: User) => {
  const action = row.status === 2 ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
      type: 'warning',
    });
    
    if (row.status === 2) {
      await unbanUser(row.id);
    } else {
      await banUser(row.id);
    }
    
    ElMessage.success(`${action}成功`);
    fetchUsers();
  } catch {
    // Cancelled
  }
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchUsers();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchUsers();
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped lang="scss">
.user-list {
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 20px;

  .el-card {
    height: 100%;
    background: rgba(26, 26, 46, 0.8);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    .el-card__header {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);
      color: #00ffff;
      font-weight: bold;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .el-form {
    margin-bottom: 20px;

    .el-form-item__label {
      color: #8a94a6;
    }

    .el-input {
      .el-input__wrapper {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }

        &.is-focus {
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
      }
    }

    .el-select {
      .el-input__wrapper {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }

        &.is-focus {
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
      }
    }

    .el-button {
      &.el-button--primary {
        background: linear-gradient(45deg, #00ffff, #0080ff);
        border: none;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

        &:hover {
          background: linear-gradient(45deg, #00ffff, #00a0ff);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
      }

      &.el-button--default {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }
      }
    }
  }

  .el-table {
    background: rgba(26, 26, 46, 0.8);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;

    .el-table__header-wrapper {
      .el-table__header {
        background: rgba(26, 26, 46, 0.9);

        th {
          background: rgba(26, 26, 46, 0.9);
          color: #00ffff;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }
      }
    }

    .el-table__body-wrapper {
      .el-table__row {
        background: rgba(26, 26, 46, 0.6);
        color: #e6e6e6;

        &:hover {
          background: rgba(26, 26, 46, 0.8);
        }

        &.el-table__row--striped {
          background: rgba(26, 26, 46, 0.4);

          &:hover {
            background: rgba(26, 26, 46, 0.8);
          }
        }

        td {
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
        }
      }
    }

    .el-tag {
      &.el-tag--success {
        background: rgba(103, 194, 58, 0.2);
        border: 1px solid rgba(103, 194, 58, 0.5);
        color: #67c23a;
      }

      &.el-tag--danger {
        background: rgba(245, 108, 108, 0.2);
        border: 1px solid rgba(245, 108, 108, 0.5);
        color: #f56c6c;
      }

      &.el-tag--info {
        background: rgba(144, 147, 153, 0.2);
        border: 1px solid rgba(144, 147, 153, 0.5);
        color: #909399;
      }
    }

    .el-button {
      &.el-button--primary {
        color: #00ffff;

        &:hover {
          color: #00ffff;
          text-decoration: underline;
        }
      }

      &.el-button--danger {
        color: #f56c6c;

        &:hover {
          color: #f56c6c;
          text-decoration: underline;
        }
      }

      &.el-button--success {
        color: #67c23a;

        &:hover {
          color: #67c23a;
          text-decoration: underline;
        }
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;

    .el-pagination {
      .el-pager {
        li {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: #00ffff;
            color: #00ffff;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
          }

          &.is-active {
            background: #00ffff;
            border-color: #00ffff;
            color: #0f0f1a;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
          }
        }
      }

      .el-pagination__sizes {
        .el-input .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
        }

        .el-select .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
        }
      }

      .el-pagination__total {
        color: #8a94a6;
      }
    }
  }

  .unit {
    margin-left: 10px;
    color: #8a94a6;
  }

  .el-dialog {
    background: rgba(26, 26, 46, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
    backdrop-filter: blur(15px);

    .el-dialog__header {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);

      .el-dialog__title {
        color: #00ffff;
      }

      .el-dialog__headerbtn {
        .el-dialog__close {
          color: #8a94a6;

          &:hover {
            color: #00ffff;
          }
        }
      }
    }

    .el-dialog__body {
      color: #e6e6e6;

      .el-form {
        .el-form-item__label {
          color: #8a94a6;
        }

        .el-input {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }
        }

        .el-input-number {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }

          .el-input-number__decrease,
          .el-input-number__increase {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              background: rgba(26, 26, 46, 1);
              border-color: #00ffff;
              color: #00ffff;
            }

            &.is-disabled {
              color: #8a94a6;
              border-color: rgba(0, 255, 255, 0.1);
            }
          }
        }

        .el-date-picker {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }
        }

        .el-radio-group {
          .el-radio {
            .el-radio__label {
              color: #e6e6e6;
            }

            .el-radio__inner {
              border: 1px solid rgba(0, 255, 255, 0.3);

              &:hover {
                border-color: #00ffff;
              }

              &.is-checked {
                border-color: #00ffff;
                background: #00ffff;

                &::after {
                  background: #0f0f1a;
                }
              }
            }
          }
        }
      }
    }

    .el-dialog__footer {
      border-top: 1px solid rgba(0, 255, 255, 0.2);

      .el-button {
        &.el-button--primary {
          background: linear-gradient(45deg, #00ffff, #0080ff);
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

          &:hover {
            background: linear-gradient(45deg, #00ffff, #00a0ff);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          }
        }

        &.el-button--default {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }
        }
      }
    }
  }

  .el-message-box {
    background: rgba(26, 26, 46, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
    backdrop-filter: blur(15px);

    .el-message-box__title {
      color: #00ffff;
    }

    .el-message-box__content {
      color: #e6e6e6;
    }

    .el-message-box__footer {
      border-top: 1px solid rgba(0, 255, 255, 0.2);

      .el-button {
        &.el-button--primary {
          background: linear-gradient(45deg, #00ffff, #0080ff);
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

          &:hover {
            background: linear-gradient(45deg, #00ffff, #00a0ff);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          }
        }

        &.el-button--default {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }
        }
      }
    }
  }
}
</style>
