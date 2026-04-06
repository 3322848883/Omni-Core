<template>
  <div class="payment-dashboard">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background-color: #409EFF;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥0.00</div>
            <div class="stat-label">今日收款</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background-color: #67C23A;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">0</div>
            <div class="stat-label">今日订单</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background-color: #E6A23C;">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">0</div>
            <div class="stat-label">支付用户</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background-color: #F56C6C;">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">0</div>
            <div class="stat-label">异常订单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收款趋势</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-empty description="暂无数据" />
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>支付方式占比</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-empty description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="recent-row">
      <el-col :xs="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="$router.push('/payment/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-empty description="暂无订单数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import {
  Money,
  Document,
  User,
  Warning,
} from '@element-plus/icons-vue';
</script>

<style scoped lang="scss">
.payment-dashboard {
  .stat-card {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 20px;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      
      .el-icon {
        font-size: 28px;
        color: #ffffff;
      }
    }
    
    .stat-info {
      flex: 1;
      
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        line-height: 1.2;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
  
  .chart-row {
    margin-top: 0;
  }
  
  .recent-row {
    margin-top: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  
  .chart-placeholder {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
