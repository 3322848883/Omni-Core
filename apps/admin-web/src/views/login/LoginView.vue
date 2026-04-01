<template>
  <div class="login-page">
    <!-- Particle Canvas Background -->
    <canvas id="particle-canvas" class="particle-canvas"></canvas>

    <div class="login-box">
      <div class="login-header">
        <OmniCoreLogo :size="100" show-text light />
        <p class="login-subtitle">管理后台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="handleLogin"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            class="dark-input"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            class="dark-input"
          />
        </el-form-item>

        <el-form-item class="remember-item">
          <el-checkbox v-model="form.remember" class="dark-checkbox">
            记住我
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <button
            type="button"
            class="login-btn"
            :disabled="authStore.loading"
            @click="handleLogin"
          >
            <span v-if="!authStore.loading">登录</span>
            <span v-else class="btn-loader">
              <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
              </svg>
            </span>
          </button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '@stores/auth';
import OmniCoreLogo from '@components/OmniCoreLogo.vue';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref<FormInstance>();

const form = reactive({
  username: '',
  password: '',
  remember: false,
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.login(form);
        ElMessage.success('登录成功');
        router.push('/dashboard');
      } catch (error) {
        ElMessage.error('登录失败');
      }
    }
  });
};

// Particle Animation
class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{x: number; y: number; vx: number; vy: number; radius: number; color: string}>;
  private animationId: number | null = null;
  private isActive = true;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.particles = [];
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const count = window.matchMedia('(pointer: coarse)').matches ? 25 : 50;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: ['#00f5ff', '#b829dd', '#ff00ff', '#e0e0ff'][Math.floor(Math.random() * 4)]
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    document.addEventListener('visibilitychange', () => {
      this.isActive = document.visibilityState === 'visible';
      if (this.isActive && !this.animationId) {
        this.animate();
      }
    });
  }

  animate() {
    if (!this.isActive) {
      this.animationId = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();

      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(0, 245, 255, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

let particleSystem: ParticleSystem | null = null;

onMounted(() => {
  particleSystem = new ParticleSystem('particle-canvas');
});

onUnmounted(() => {
  if (particleSystem) {
    particleSystem.destroy();
  }
});
</script>

<style scoped lang="scss">
// Override Element Plus styles with high specificity
.login-page {
  --login-bg: #0a0a0f;
  --login-brand-primary: #00f5ff;
  --login-brand-secondary: #b829dd;
  --login-brand-tertiary: #ff00ff;
  --login-text-primary: #ffffff;
  --login-text-secondary: rgba(224, 224, 255, 0.7);
  --login-text-tertiary: rgba(224, 224, 255, 0.5);
  --login-glass-bg: rgba(255, 255, 255, 0.03);
  --login-glass-border: rgba(255, 255, 255, 0.08);
  --login-gradient: linear-gradient(135deg, #00f5ff 0%, #b829dd 50%, #ff00ff 100%);

  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--login-bg) !important;
  position: relative;
  overflow: hidden;
}

.particle-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.login-box {
  width: 420px;
  padding: 40px;
  background: var(--login-glass-bg);
  border: 1px solid var(--login-glass-border);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.login-subtitle {
  text-align: center;
  margin: 0;
  font-size: 14px;
  color: var(--login-text-secondary);
  letter-spacing: 0.1em;
}

.login-form {
  :deep(.el-form-item__label) {
    color: var(--login-text-secondary) !important;
    font-weight: 500;
    padding-bottom: 8px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  .remember-item {
    margin-bottom: 24px;
  }
}

// Dark Input Styling - override Element Plus
.dark-input {
  :deep(.el-input__wrapper) {
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    padding: 4px 16px !important;

    &:hover, &:focus, &.is-focus {
      border-color: var(--login-brand-primary) !important;
      box-shadow: 0 0 0 1px var(--login-brand-primary) !important;
    }
  }

  :deep(.el-input__inner) {
    color: var(--login-text-primary) !important;
    height: 44px !important;
    font-size: 15px !important;
    background: transparent !important;

    &::placeholder {
      color: var(--login-text-tertiary) !important;
    }
  }

  :deep(.el-input__icon) {
    color: var(--login-text-tertiary) !important;
  }

  :deep(.el-input__suffix-inner) {
    color: var(--login-text-tertiary) !important;
  }
}

// Dark Checkbox - override Element Plus
.dark-checkbox {
  :deep(.el-checkbox__input) {
    .el-checkbox__inner {
      background: rgba(0, 0, 0, 0.3) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      border-radius: 6px !important;
      width: 18px !important;
      height: 18px !important;

      &:hover {
        border-color: var(--login-brand-primary) !important;
      }

      &::after {
        border-color: #0a0a0f !important;
        width: 4px !important;
        height: 8px !important;
        left: 6px !important;
        top: 3px !important;
      }
    }

    &.is-checked {
      .el-checkbox__inner {
        background: var(--login-gradient) !important;
        border-color: transparent !important;
      }
    }
  }

  :deep(.el-checkbox__label) {
    color: var(--login-text-secondary) !important;
    font-size: 14px !important;
    padding-left: 10px !important;
  }
}

// Login Button
.login-btn {
  width: 100%;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--login-gradient);
  color: #0a0a0f;
  box-shadow: 0 4px 20px rgba(0, 245, 255, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 245, 255, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 480px) {
  .login-box {
    width: 90%;
    max-width: 360px;
    padding: 32px 24px;
    margin: 20px;
  }
}
</style>
