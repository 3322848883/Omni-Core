<template>
  <div class="landing-container">
    <!-- 1. 导航栏 -->
    <nav id="navbar" class="navbar">
      <div class="nav-container">
        <a href="#" class="nav-logo">
          <img src="/omnicore-liquid-logo.svg" alt="Omni Core Logo" class="logo-img">
          <div class="logo-text">
            <span class="logo-main">Omni Core</span>
          </div>
        </a>

        <div class="nav-links">
          <a href="#features" class="nav-link">功能</a>
          <a href="#servers" class="nav-link">节点</a>
          <a href="#faq" class="nav-link">FAQ</a>
        </div>

        <div class="nav-actions">
          <button class="btn btn-outline" @click="scrollToAuth('login')">登录</button>
          <button class="btn btn-primary" @click="scrollToAuth('register')">注册</button>
        </div>
      </div>
    </nav>

    <!-- 2. Hero 区域 -->
    <header id="hero" class="hero">
      <div class="hero-content">
        <div class="hero-logo">
          <img src="/omnicore-liquid-logo.svg" alt="Omni Core Logo" class="hero-logo-img">
        </div>
        <h1 class="hero-title">安全、快速、匿名的网络体验</h1>
        <p class="hero-subtitle">Omni Core 提供军事级加密保护，让您自由访问全球网络</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" @click="scrollToAuth('register')">立即开始</button>
          <button class="btn btn-outline btn-lg" @click="scrollToSection('features')">了解更多</button>
        </div>
      </div>
    </header>

    <!-- 3. 登录/注册区域 -->
    <section id="auth" class="auth-section">
      <div class="container">
        <div class="auth-card glass-card">
          <!-- 登录表单 -->
          <div v-if="authMode === 'login'" class="auth-form">
            <h2 class="auth-title">欢迎回来</h2>
            <form @submit.prevent="handleLogin">
              <div class="form-group">
                <label class="form-label">邮箱 / 用户名</label>
                <input type="text" class="form-input" v-model="loginForm.username" placeholder="请输入邮箱或用户名" required>
              </div>
              <div class="form-group">
                <label class="form-label">密码</label>
                <input type="password" class="form-input" v-model="loginForm.password" placeholder="请输入密码" required>
              </div>
              <div class="form-options">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="loginForm.remember">
                  <span>记住我</span>
                </label>
                <a href="#" class="form-link">忘记密码？</a>
              </div>
              <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
                <span v-if="!loading">登录</span>
                <span v-else>登录中...</span>
              </button>
            </form>
            <p class="auth-switch">
              还没有账号？<a href="#" class="form-link" @click.prevent="authMode = 'register'">立即注册</a>
            </p>
          </div>

          <!-- 注册表单 -->
          <div v-else class="auth-form">
            <h2 class="auth-title">创建账号</h2>
            <form @submit.prevent="handleRegister">
              <div class="form-group">
                <label class="form-label">邮箱</label>
                <input type="email" class="form-input" v-model="registerForm.email" placeholder="请输入邮箱" required>
              </div>
              <div class="form-group">
                <label class="form-label">用户名</label>
                <input type="text" class="form-input" v-model="registerForm.username" placeholder="请输入用户名" required>
              </div>
              <div class="form-group">
                <label class="form-label">密码</label>
                <input type="password" class="form-input" v-model="registerForm.password" placeholder="请输入密码（至少8位）" minlength="8" required>
              </div>
              <div class="form-group">
                <label class="form-label">确认密码</label>
                <input type="password" class="form-input" v-model="registerForm.confirmPassword" placeholder="请再次输入密码" required>
              </div>
              <div class="form-group">
                <label class="form-label">邀请码（可选）</label>
                <input type="text" class="form-input" v-model="registerForm.inviteCode" placeholder="如有邀请码请输入">
              </div>
              <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
                <span v-if="!loading">注册</span>
                <span v-else>注册中...</span>
              </button>
            </form>
            <p class="auth-switch">
              已有账号？<a href="#" class="form-link" @click.prevent="authMode = 'login'">立即登录</a>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. 功能特性 -->
    <section id="features" class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">为什么选择 Omni Core</h2>
          <p class="section-subtitle">我们致力于为您提供最优质的 VPN 服务体验</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Lock /></el-icon>
            </div>
            <h3 class="feature-title">军事级加密</h3>
            <p class="feature-desc">采用 AES-256 加密算法，保护您的数据安全</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><MapLocation /></el-icon>
            </div>
            <h3 class="feature-title">全球节点</h3>
            <p class="feature-desc">50+ 国家/地区，200+ 服务器节点</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Lightning /></el-icon>
            </div>
            <h3 class="feature-title">极速连接</h3>
            <p class="feature-desc">专线优化，延迟低至 10ms</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><DocumentChecked /></el-icon>
            </div>
            <h3 class="feature-title">零日志政策</h3>
            <p class="feature-desc">不记录任何用户活动日志，保护隐私</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <h3 class="feature-title">多平台支持</h3>
            <p class="feature-desc">支持 Windows、Mac、iOS、Android、Linux</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 服务器节点 -->
    <section id="servers" class="servers-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">全球服务器节点</h2>
          <p class="section-subtitle">覆盖全球主要地区，为您提供稳定的连接</p>
        </div>
        <div class="servers-stats">
          <div class="stat-item">
            <span class="stat-number">50+</span>
            <span class="stat-label">国家/地区</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">200+</span>
            <span class="stat-label">服务器节点</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">99.9%</span>
            <span class="stat-label">在线率</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. FAQ -->
    <section id="faq" class="faq-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">常见问题</h2>
        </div>
        <div class="faq-list">
          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(0)">
              <span>Omni Core 支持哪些设备？</span>
              <el-icon><ArrowDown /></el-icon>
            </button>
            <div v-show="faqOpen[0]" class="faq-answer">
              <p>我们支持 Windows、Mac、iOS、Android、Linux 等多种平台，您可以在任何设备上使用 Omni Core。</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(1)">
              <span>Omni Core 会记录我的上网日志吗？</span>
              <el-icon><ArrowDown /></el-icon>
            </button>
            <div v-show="faqOpen[1]" class="faq-answer">
              <p>绝对不会。我们采用零日志政策，不记录用户的任何上网活动。</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-question" @click="toggleFaq(2)">
              <span>一个账号可以在多台设备上使用吗？</span>
              <el-icon><ArrowDown /></el-icon>
            </button>
            <div v-show="faqOpen[2]" class="faq-answer">
              <p>可以。根据您的套餐不同，支持 3-10 台设备同时在线。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. 页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-bottom">
          <p>&copy; 2026 Omni Core. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, MapLocation, Lightning, DocumentChecked, Monitor, ArrowDown } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { login, register } from '@/api/auth';

const router = useRouter();
const userStore = useUserStore();

const authMode = ref<'login' | 'register'>('login');
const loading = ref(false);
const faqOpen = ref<boolean[]>([false, false, false]);

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
});

const registerForm = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
});

const scrollToAuth = (mode: 'login' | 'register') => {
  authMode.value = mode;
  const authSection = document.getElementById('auth');
  if (authSection) {
    authSection.scrollIntoView({ behavior: 'smooth' });
  }
};

const scrollToSection = (id: string) => {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};

const toggleFaq = (index: number) => {
  faqOpen.value[index] = !faqOpen.value[index];
};

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  loading.value = true;
  try {
    const res = await login({
      email: loginForm.username,
      password: loginForm.password,
    } as any);

    if (res.success) {
      localStorage.setItem('token', res.data.tokens.accessToken);
      localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      
      userStore.setUserInfo(res.data.user);
      userStore.setToken(res.data.tokens.accessToken);
      
      ElMessage.success('登录成功');
      router.push('/app');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  if (!registerForm.email || !registerForm.username || !registerForm.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.warning('两次密码输入不一致');
    return;
  }

  loading.value = true;
  try {
    const res = await register({
      email: registerForm.email,
      username: registerForm.username,
      password: registerForm.password,
      inviteCode: registerForm.inviteCode,
    });

    if (res.success) {
      localStorage.setItem('token', res.data.tokens.accessToken);
      localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      
      userStore.setUserInfo(res.data.user);
      userStore.setToken(res.data.tokens.accessToken);
      
      ElMessage.success('注册成功');
      router.push('/app');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.landing-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  color: #fff;
}

// 导航栏
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: #fff;

    .logo-img {
      width: 40px;
      height: 40px;
    }

    .logo-main {
      font-size: 1.5rem;
      font-weight: 700;
    }
  }

  .nav-links {
    display: flex;
    gap: 2rem;

    .nav-link {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;

      &:hover {
        color: #fff;
      }
    }
  }

  .nav-actions {
    display: flex;
    gap: 1rem;
  }
}

// Hero区域
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 2rem 4rem;

  .hero-logo-img {
    width: 120px;
    height: 120px;
    margin-bottom: 2rem;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 0%, #a0a0ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2rem;
  }

  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
}

// 按钮样式
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  font-size: 1rem;

  &.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
  }

  &.btn-outline {
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;

    &:hover {
      border-color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &.btn-lg {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  &.btn-full {
    width: 100%;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 认证区域
.auth-section {
  padding: 4rem 2rem;

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .auth-card {
    max-width: 450px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .auth-title {
    font-size: 1.75rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
    }

    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 1rem;
      transition: border-color 0.3s;

      &:focus {
        outline: none;
        border-color: #667eea;
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
    }

    .form-link {
      color: #667eea;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .auth-switch {
    text-align: center;
    margin-top: 1.5rem;
    color: rgba(255, 255, 255, 0.7);

    .form-link {
      color: #667eea;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 功能特性
.features-section {
  padding: 4rem 2rem;

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .feature-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .feature-desc {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

// 服务器节点
.servers-section {
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.02);

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .servers-stats {
    display: flex;
    justify-content: center;
    gap: 4rem;
    flex-wrap: wrap;

    .stat-item {
      text-align: center;

      .stat-number {
        display: block;
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
}

// FAQ
.faq-section {
  padding: 4rem 2rem;

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
    }
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;

    .faq-question {
      width: 100%;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.1rem;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
    }

    .faq-answer {
      padding: 0 1.25rem 1.25rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

// 页脚
.footer {
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-bottom {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
