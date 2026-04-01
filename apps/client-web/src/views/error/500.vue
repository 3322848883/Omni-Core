<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">500</h1>
      <h2 class="error-title">服务器错误</h2>
      <p class="error-desc">抱歉，服务器出现了问题，请稍后重试</p>
      <el-button type="primary" size="large" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;

  .error-content {
    text-align: center;
    padding: 40px;

    .error-code {
      font-size: 120px;
      font-weight: 700;
      color: #f56c6c;
      margin: 0;
      line-height: 1;
    }

    .error-title {
      font-size: 28px;
      color: #303133;
      margin: 24px 0 16px;
    }

    .error-desc {
      font-size: 16px;
      color: #909399;
      margin-bottom: 32px;
    }
  }
}
</style>
