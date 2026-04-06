/**
 * Omni Core VPN Landing Page - JavaScript
 * Omni Core VPN Service
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    particleCount: window.matchMedia('(pointer: coarse)').matches ? 25 : 50,
    particleSpeed: 0.5,
    connectionDistance: 150,
    mouseRadius: 100,
    apiBaseUrl: (() => {
      const host = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol;
      // 如果是通过 IP:8082 访问，API 在 IP:3002
      if (port === '8082') {
        return `http://${host}:3002/api/v1/client`;
      }
      // 其他情况使用相对路径（通过 Nginx 代理）
      return '/api/v1/client';
    })(),
    scrollOffset: 80
  };

  // Debug: log config
  console.log('[DEBUG] Host:', window.location.hostname);
  console.log('[DEBUG] Port:', window.location.port);
  console.log('[DEBUG] API Base URL:', CONFIG.apiBaseUrl);

  // ============================================
  // Particle Animation System
  // ============================================
  class ParticleSystem {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.error('Particle canvas not found:', canvasId);
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        console.error('Could not get 2D context for canvas');
        return;
      }

      this.particles = [];
      this.mouse = { x: null, y: null };
      this.animationId = null;
      this.isActive = true;

      this.init();
    }

    init() {
      if (!this.canvas || !this.ctx) return;
      this.resize();
      this.createParticles();
      this.bindEvents();
      this.animate();
    }

    resize() {
      if (!this.canvas) return;
      // For global canvas, use window dimensions
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    createParticles() {
      if (!this.canvas) return;
      this.particles = [];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * CONFIG.particleSpeed,
          vy: (Math.random() - 0.5) * CONFIG.particleSpeed,
          radius: Math.random() * 2 + 1,
          color: this.getRandomColor()
        });
      }
    }

    getRandomColor() {
      const colors = ['#00f5ff', '#b829dd', '#ff00ff', '#e0e0ff'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    bindEvents() {
      if (!this.canvas) return;

      window.addEventListener('resize', () => {
        this.resize();
        this.createParticles();
      });

      this.canvas.addEventListener('mousemove', (e) => {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });

      // Keep animation running continuously (no pause on scroll)
      // Animation will only pause when page is hidden (tab switch)
      document.addEventListener('visibilitychange', () => {
        this.isActive = document.visibilityState === 'visible';
        if (this.isActive && !this.animationId) {
          this.animate();
        }
      });
    }

    animate() {
      if (!this.isActive || !this.canvas || !this.ctx) {
        this.animationId = null;
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Update and draw particles
      this.particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

        // Mouse interaction
        if (this.mouse.x !== null && this.mouse.y !== null) {
          const dx = this.mouse.x - particle.x;
          const dy = this.mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.mouseRadius) {
            const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
            particle.vx -= (dx / distance) * force * 0.02;
            particle.vy -= (dy / distance) * force * 0.02;
          }
        }

        // Draw particle
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.fill();

        // Draw connections
        for (let j = i + 1; j < this.particles.length; j++) {
          const other = this.particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.connectionDistance) {
            const opacity = (1 - distance / CONFIG.connectionDistance) * 0.3;
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

  // ============================================
  // Scroll Animations
  // ============================================
  class ScrollAnimations {
    constructor() {
      this.observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
      };

      this.init();
    }

    init() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, this.observerOptions);

      // Observe elements with animation classes
      document.querySelectorAll('.feature-card, .server-card, .step-item, .faq-item, .stat-item').forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
      });
    }
  }

  // ============================================
  // Navigation
  // ============================================
  class Navigation {
    constructor() {
      this.navbar = document.getElementById('navbar');
      this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
      this.mobileMenu = document.querySelector('.mobile-menu');
      this.isMenuOpen = false;

      this.init();
    }

    init() {
      // Navbar scroll effect
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          this.navbar.classList.add('scrolled');
        } else {
          this.navbar.classList.remove('scrolled');
        }
      });

      // Mobile menu toggle
      if (this.mobileMenuBtn) {
        this.mobileMenuBtn.addEventListener('click', () => {
          this.toggleMobileMenu();
        });
      }

      // Close mobile menu on link click
      document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
          this.closeMobileMenu();
        });
      });

      // Close mobile menu on outside click
      document.addEventListener('click', (e) => {
        if (this.isMenuOpen && !this.navbar.contains(e.target)) {
          this.closeMobileMenu();
        }
      });
    }

    toggleMobileMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      this.mobileMenuBtn.classList.toggle('active');
      this.mobileMenu.classList.toggle('active');
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    }

    closeMobileMenu() {
      this.isMenuOpen = false;
      this.mobileMenuBtn.classList.remove('active');
      this.mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // Form Handling
  // ============================================
  class FormHandler {
    constructor() {
      this.currentForm = 'login';
    }

    showLoading(button, show) {
      const text = button.querySelector('.btn-text');
      const loader = button.querySelector('.btn-loader');

      if (show) {
        button.disabled = true;
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline-flex';
      } else {
        button.disabled = false;
        if (text) text.style.display = 'inline';
        if (loader) loader.style.display = 'none';
      }
    }

    showMessage(message, type = 'error') {
      // Remove existing messages
      const existing = document.querySelector('.form-message');
      if (existing) existing.remove();

      const msgEl = document.createElement('div');
      msgEl.className = `form-message form-message-${type}`;
      msgEl.textContent = message;

      const form = document.querySelector('.auth-form:not([style*="display: none"])');
      if (form) {
        form.insertBefore(msgEl, form.firstChild);

        setTimeout(() => {
          msgEl.remove();
        }, 5000);
      }
    }

    validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async handleLogin(event) {
      event.preventDefault();
      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');

      const username = form.username.value.trim();
      const password = form.password.value;
      const remember = form.remember?.checked || false;

      // 前端表单验证
      if (!username) {
        this.showMessage('请输入邮箱地址');
        form.username.focus();
        return;
      }

      if (!this.validateEmail(username)) {
        this.showMessage('请输入有效的邮箱地址格式');
        form.username.focus();
        return;
      }

      if (!password) {
        this.showMessage('请输入密码');
        form.password.focus();
        return;
      }

      this.showLoading(submitBtn, true);

      // Debug: log API URL
      console.log('Login API URL:', `${CONFIG.apiBaseUrl}/auth/login`);

      try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: username, password, remember })
        });

        console.log('Login response status:', response.status);

        const data = await response.json();
        console.log('Login response data:', data);

        if (response.ok && data.success) {
          // Store all auth data in localStorage to match Vue app expectations
          if (data.data.tokens) {
            localStorage.setItem('token', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          }
          localStorage.setItem('userInfo', JSON.stringify(data.data.user));

          this.showMessage('登录成功！正在跳转...', 'success');

          // Notify parent window (Vue app) via postMessage
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'LOGIN_SUCCESS',
              data: data.data
            }, '*');
            // Also try direct navigation after short delay as fallback
            setTimeout(() => {
              if (window.top && window.top !== window) {
                window.top.location.href = '/app';
              }
            }, 500);
          } else {
            // Standalone mode - redirect directly
            setTimeout(() => {
              window.location.href = '/app';
            }, 500);
          }
        } else {
          // 根据错误类型显示友好的错误信息
          const errorMessage = this.getLoginErrorMessage(data.code, data.message);
          this.showMessage(errorMessage);
        }
      } catch (error) {
        console.error('Login error:', error);
        // 网络错误细分
        if (!navigator.onLine) {
          this.showMessage('网络连接已断开，请检查网络设置');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          this.showMessage('无法连接到服务器，请稍后重试');
        } else {
          this.showMessage('服务器繁忙，请稍后重试');
        }
      } finally {
        this.showLoading(submitBtn, false);
      }
    }

    /**
     * 获取登录错误提示信息
     */
    getLoginErrorMessage(code, message) {
      // 根据后端错误码或消息映射用户友好的提示
      if (message?.includes('Invalid credentials') || message?.includes('credentials')) {
        return '邮箱或密码错误，请重新输入';
      }
      if (message?.includes('not active') || message?.includes('Account is not active')) {
        return '账号已被禁用，请联系客服';
      }
      if (message?.includes('locked') || message?.includes('suspended')) {
        return '账号已被锁定，请稍后再试或联系客服';
      }
      if (code === 429 || message?.includes('rate limit') || message?.includes('too many')) {
        return '登录尝试次数过多，请稍后再试';
      }
      if (code === 400) {
        return '请求参数错误，请检查输入信息';
      }
      if (code === 500) {
        return '服务器内部错误，请稍后重试';
      }
      return message || '登录失败，请检查邮箱和密码';
    }

    async handleRegister(event) {
      event.preventDefault();
      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');

      const email = form.email.value.trim();
      const username = form.username.value.trim();
      const password = form.password.value;
      const confirmPassword = form.confirmPassword.value;
      const inviteCode = form.inviteCode?.value.trim() || '';
      const agree = form.agree?.checked || false;

      // 前端表单验证 - 逐个字段检查并聚焦
      if (!email) {
        this.showMessage('请输入邮箱地址');
        form.email.focus();
        return;
      }

      if (!this.validateEmail(email)) {
        this.showMessage('请输入有效的邮箱地址格式，如：example@qq.com');
        form.email.focus();
        return;
      }

      if (!username) {
        this.showMessage('请输入用户名');
        form.username.focus();
        return;
      }

      if (username.length < 3 || username.length > 20) {
        this.showMessage('用户名长度需在3-20个字符之间');
        form.username.focus();
        return;
      }

      if (!password) {
        this.showMessage('请设置登录密码');
        form.password.focus();
        return;
      }

      if (password.length < 8 || password.length > 32) {
        this.showMessage('密码长度需在8-32位之间');
        form.password.focus();
        return;
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        this.showMessage('密码需同时包含大写字母、小写字母和数字');
        form.password.focus();
        return;
      }

      if (!confirmPassword) {
        this.showMessage('请再次输入密码以确认');
        form.confirmPassword.focus();
        return;
      }

      if (password !== confirmPassword) {
        this.showMessage('两次输入的密码不一致，请重新输入');
        form.confirmPassword.value = '';
        form.confirmPassword.focus();
        return;
      }

      if (!agree) {
        this.showMessage('请阅读并同意服务条款和隐私政策');
        return;
      }

      this.showLoading(submitBtn, true);

      try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            password,
            confirmPassword,
            inviteCode,
            agreeTerms: agree
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          this.showMessage('🎉 注册成功！正在跳转到登录页面...', 'success');

          // Switch to login form
          setTimeout(() => {
            switchAuthForm('login');
          }, 1500);
        } else {
          // 根据错误类型显示友好的错误信息
          const errorMessage = this.getRegisterErrorMessage(data.code, data.message);
          this.showMessage(errorMessage);
        }
      } catch (error) {
        console.error('Register error:', error);
        // 网络错误细分
        if (!navigator.onLine) {
          this.showMessage('网络连接已断开，请检查网络设置');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          this.showMessage('无法连接到服务器，请稍后重试');
        } else {
          this.showMessage('服务器繁忙，请稍后重试');
        }
      } finally {
        this.showLoading(submitBtn, false);
      }
    }

    /**
     * 获取注册错误提示信息
     */
    getRegisterErrorMessage(code, message) {
      // 根据后端错误码或消息映射用户友好的提示
      if (message?.includes('Email already registered') || message?.includes('already exists')) {
        return '该邮箱已被注册，请直接登录或找回密码';
      }
      if (message?.includes('Username already taken') || message?.includes('username exists')) {
        return '该用户名已被使用，请更换其他用户名';
      }
      if (message?.includes('Invalid invite code') || message?.includes('invite')) {
        return '邀请码无效或已过期，请检查输入';
      }
      if (message?.includes('password') && message?.includes('match')) {
        return '两次输入的密码不一致';
      }
      if (code === 400) {
        return '注册信息填写有误，请检查各项输入';
      }
      if (code === 429) {
        return '注册请求过于频繁，请稍后再试';
      }
      if (code === 500) {
        return '服务器内部错误，请稍后重试';
      }
      return message || '注册失败，请检查信息后重试';
    }
  }

  // ============================================
  // FAQ Accordion
  // ============================================
  class FAQAccordion {
    constructor() {
      this.items = document.querySelectorAll('.faq-item');
    }

    toggle(element) {
      const item = element.closest('.faq-item');
      const isActive = item.classList.contains('active');

      // Close all items
      this.items.forEach(i => {
        i.classList.remove('active');
        const answer = i.querySelector('.faq-answer');
        if (answer) {
          answer.style.maxHeight = null;
        }
      });

      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        if (answer) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      }
    }
  }

  // ============================================
  // Smooth Scroll
  // ============================================
  function smoothScrollTo(target, offset = CONFIG.scrollOffset) {
    let element;

    if (typeof target === 'string') {
      element = document.querySelector(target);
    } else {
      element = target;
    }

    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  // ============================================
  // Global Functions (exposed to HTML)
  // ============================================
  const formHandler = new FormHandler();
  const faqAccordion = new FAQAccordion();

  // Expose formHandler and CONFIG to window for automated testing (development only)
  // In production, these should not be exposed to prevent potential security risks
  if (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.search.includes('test=true')) {
    window.formHandler = formHandler;
    window.CONFIG = CONFIG;
  }

  window.handleLogin = function(event) {
    formHandler.handleLogin(event);
  };

  window.handleRegister = function(event) {
    formHandler.handleRegister(event);
  };

  window.switchAuthForm = function(type) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (type === 'login') {
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
      loginForm.classList.add('fade-in');
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      registerForm.classList.add('fade-in');
    }

    // Update URL hash without scrolling
    history.replaceState(null, null, `#${type}`);
  };

  window.toggleFaq = function(element) {
    faqAccordion.toggle(element);
  };

  window.scrollToAuth = function(type) {
    smoothScrollTo('#auth');
    if (type) {
      setTimeout(() => {
        switchAuthForm(type);
      }, 500);
    }
  };

  window.scrollToSection = function(id) {
    smoothScrollTo(`#${id}`);
  };

  // ============================================
  // Initialize
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page initializing...');

    // Initialize particle system
    try {
      window.particleSystem = new ParticleSystem('particle-canvas');
      console.log('Particle system initialized');
    } catch (error) {
      console.error('Failed to initialize particle system:', error);
    }

    // Initialize scroll animations
    try {
      new ScrollAnimations();
      console.log('Scroll animations initialized');
    } catch (error) {
      console.error('Failed to initialize scroll animations:', error);
    }

    // Initialize navigation
    try {
      new Navigation();
      console.log('Navigation initialized');
    } catch (error) {
      console.error('Failed to initialize navigation:', error);
    }

    // Check URL hash for auth form
    const hash = window.location.hash.slice(1);
    if (hash === 'login' || hash === 'register') {
      setTimeout(() => {
        smoothScrollTo('#auth');
        switchAuthForm(hash);
      }, 500);
    }

    // Add CSS animation class
    const style = document.createElement('style');
    style.textContent = `
      .scroll-animate {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }

      .scroll-animate.animate-in {
        opacity: 1;
        transform: translateY(0);
      }

      .fade-in {
        animation: fadeIn 0.4s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .form-message {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        animation: slideDown 0.3s ease;
      }

      .form-message-error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      .form-message-success {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.2);
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }

      .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
      }

      .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
    `;
    document.head.appendChild(style);

    // Console welcome message
    console.log('%c Omni Core VPN ', 'background: linear-gradient(90deg, #00f5ff, #b829dd, #ff00ff); color: #fff; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px;');
    console.log('%c Omni Core - Secure, Fast, Anonymous ', 'color: #00f5ff; font-size: 14px;');

    // Mobile device detection and optimizations
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const isMobile = window.innerWidth < 768;

    if (isTouchDevice) {
      document.body.classList.add('touch-device');
    }

    if (isMobile) {
      document.body.classList.add('mobile-device');
    }

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        particleSystem.resize();
      }, 100);
    });

    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Load site configuration from backend
    loadSiteConfig();
  });

  // Default configurations (fallback)
  const DEFAULT_CONFIG = {
    site_name: 'Omni Core',
    site_description: '安全、快速、匿名的网络体验',
    hero_title: '安全、快速、匿名的网络体验',
    hero_subtitle: 'Omni Core 提供军事级加密保护，让您自由访问全球网络',
    features_title: '为什么选择 Omni Core',
    servers_title: '全球服务器节点',
    pricing_title: '选择适合您的方案',
    cta_title: '准备好开始了吗？',
    cta_subtitle: '立即注册，开启安全网络之旅',
    stats_countries: '50+',
    stats_servers: '200+',
    stats_uptime: '99.9%',
    copyright_year: '2026',
    enable_pricing: true,
    social_telegram: 'https://t.me/omnicore',
    social_twitter: '',
    social_github: '',
    contact_email: 'support@omnicore.vpn',
    pricing_monthly: { price: 29, duration: 30, devices: 3, name: '月付套餐' },
    pricing_quarterly: { price: 79, duration: 90, devices: 5, name: '季付套餐', discount: 8 },
    pricing_yearly: { price: 269, duration: 365, devices: 10, name: '年付套餐', discount: 79 }
  };

  // Global site configuration
  let siteConfig = { ...DEFAULT_CONFIG };

  // Load site configuration from backend
  async function loadSiteConfig() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/site-config/public`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          siteConfig = { ...DEFAULT_CONFIG, ...data.data };
          applySiteConfig();
          return;
        }
      }
    } catch (error) {
      console.log('Using default site config');
    }

    // Apply default config if API fails
    applySiteConfig();
  }

  // Apply configuration to the page
  function applySiteConfig() {
    // Update page title
    if (siteConfig.site_name) {
      document.title = `${siteConfig.site_name} - ${siteConfig.site_description || ''}`;
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && siteConfig.seo_description) {
      metaDesc.setAttribute('content', siteConfig.seo_description);
    }

    // Update hero section
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && siteConfig.hero_title) {
      heroTitle.textContent = siteConfig.hero_title;
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && siteConfig.hero_subtitle) {
      heroSubtitle.textContent = siteConfig.hero_subtitle;
    }

    // Update section titles
    const featuresTitle = document.querySelector('#features .section-title');
    if (featuresTitle && siteConfig.features_title) {
      featuresTitle.textContent = siteConfig.features_title;
    }

    const serversTitle = document.querySelector('#servers .section-title');
    if (serversTitle && siteConfig.servers_title) {
      serversTitle.textContent = siteConfig.servers_title;
    }

    const pricingTitle = document.querySelector('#pricing .section-title');
    if (pricingTitle && siteConfig.pricing_title) {
      pricingTitle.textContent = siteConfig.pricing_title;
    }

    const ctaTitle = document.querySelector('.cta-title');
    if (ctaTitle && siteConfig.cta_title) {
      ctaTitle.textContent = siteConfig.cta_title;
    }

    const ctaSubtitle = document.querySelector('.cta-subtitle');
    if (ctaSubtitle && siteConfig.cta_subtitle) {
      ctaSubtitle.textContent = siteConfig.cta_subtitle;
    }

    // Update stats
    const statsCountries = document.querySelector('.servers-stats .stat-item:nth-child(1) .stat-number');
    if (statsCountries && siteConfig.stats_countries) {
      statsCountries.textContent = siteConfig.stats_countries;
    }

    const statsServers = document.querySelector('.servers-stats .stat-item:nth-child(2) .stat-number');
    if (statsServers && siteConfig.stats_servers) {
      statsServers.textContent = siteConfig.stats_servers;
    }

    const statsUptime = document.querySelector('.servers-stats .stat-item:nth-child(3) .stat-number');
    if (statsUptime && siteConfig.stats_uptime) {
      statsUptime.textContent = siteConfig.stats_uptime;
    }

    // Update copyright
    const copyright = document.querySelector('.footer-bottom p');
    if (copyright && siteConfig.copyright_year) {
      copyright.innerHTML = `&copy; ${siteConfig.copyright_year} ${siteConfig.site_name || 'Omni Core'}. All rights reserved.`;
    }

    // Update contact email
    const contactEmail = document.querySelector('a[href^="mailto:"]');
    if (contactEmail && siteConfig.contact_email) {
      contactEmail.href = `mailto:${siteConfig.contact_email}`;
      contactEmail.textContent = siteConfig.contact_email;
    }

    // Update social links
    const telegramLink = document.querySelector('.social-link[aria-label="Telegram"]');
    if (telegramLink && siteConfig.social_telegram) {
      telegramLink.href = siteConfig.social_telegram;
      telegramLink.style.display = siteConfig.social_telegram ? 'flex' : 'none';
    }

    const twitterLink = document.querySelector('.social-link[aria-label="Twitter"]');
    if (twitterLink && siteConfig.social_twitter) {
      twitterLink.href = siteConfig.social_twitter;
      twitterLink.style.display = siteConfig.social_twitter ? 'flex' : 'none';
    }

    const githubLink = document.querySelector('.social-link[aria-label="GitHub"]');
    if (githubLink && siteConfig.social_github) {
      githubLink.href = siteConfig.social_github;
      githubLink.style.display = siteConfig.social_github ? 'flex' : 'none';
    }

    // Show/hide pricing section
    const pricingSection = document.getElementById('pricing');
    if (pricingSection && siteConfig.enable_pricing === false) {
      pricingSection.style.display = 'none';
    }

    // Update pricing
    updatePricingDisplay();
  }

  // Update pricing display
  function updatePricingDisplay() {
    const monthly = siteConfig.pricing_monthly;
    const quarterly = siteConfig.pricing_quarterly;
    const yearly = siteConfig.pricing_yearly;

    // Update monthly
    if (monthly) {
      const monthlyPrice = document.querySelector('[data-price="monthly"]');
      const monthlyName = document.querySelector('[data-plan="monthly"] .pricing-name');
      if (monthlyPrice) monthlyPrice.textContent = monthly.price || '--';
      if (monthlyName && monthly.name) monthlyName.textContent = monthly.name;
    }

    // Update quarterly
    if (quarterly) {
      const quarterlyPrice = document.querySelector('[data-price="quarterly"]');
      const quarterlySave = document.querySelector('[data-save="quarterly"]');
      const quarterlyName = document.querySelector('[data-plan="quarterly"] .pricing-name');
      if (quarterlyPrice) quarterlyPrice.textContent = quarterly.price || '--';
      if (quarterlyName && quarterly.name) quarterlyName.textContent = quarterly.name;
      if (quarterlySave && monthly) {
        const save = (monthly.price || 29) * 3 - (quarterly.price || 79);
        quarterlySave.textContent = `¥${save}`;
      }
    }

    // Update yearly
    if (yearly) {
      const yearlyPrice = document.querySelector('[data-price="yearly"]');
      const yearlySave = document.querySelector('[data-save="yearly"]');
      const yearlyName = document.querySelector('[data-plan="yearly"] .pricing-name');
      if (yearlyPrice) yearlyPrice.textContent = yearly.price || '--';
      if (yearlyName && yearly.name) yearlyName.textContent = yearly.name;
      if (yearlySave && monthly) {
        const save = (monthly.price || 29) * 12 - (yearly.price || 269);
        yearlySave.textContent = `¥${save}`;
      }
    }
  }

  // Select plan and redirect to register
  window.selectPlan = function(planType) {
    // Store selected plan in sessionStorage
    sessionStorage.setItem('selectedPlan', planType);

    // Scroll to auth section and show register form
    scrollToAuth('register');

    // You can also pass plan info to the form
    console.log(`Selected plan: ${planType}`);
  };

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    if (window.particleSystem) {
      window.particleSystem.destroy();
    }
  });

})();
