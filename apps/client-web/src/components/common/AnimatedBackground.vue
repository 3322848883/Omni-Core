<template>
  <div class="animated-background-wrapper">
    <!-- 渐变背景层 -->
    <div class="gradient-bg"></div>
    
    <!-- 动态网格 -->
    <div class="grid-overlay"></div>
    
    <!-- 浮动粒子 -->
    <div class="particles">
      <div v-for="n in 20" :key="n" class="particle" :style="getParticleStyle(n)"></div>
    </div>
    
    <!-- 光晕效果 -->
    <div class="glow-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    
    <!-- 内容插槽 -->
    <div class="content-wrapper">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// 生成粒子样式
const getParticleStyle = (index: number) => {
  const size = Math.random() * 4 + 2;
  const left = Math.random() * 100;
  const delay = Math.random() * 20;
  const duration = Math.random() * 10 + 15;
  const opacity = Math.random() * 0.5 + 0.2;
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity: opacity,
  };
};
</script>

<style scoped lang="scss">
.animated-background-wrapper {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

// 渐变背景层
.gradient-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%),
    linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
  animation: gradientMove 20s ease-in-out infinite;
  z-index: 0;
  pointer-events: none;
}

@keyframes gradientMove {
  0%, 100% {
    background-position: 0% 0%, 100% 100%, 50% 50%, 0% 0%;
  }
  25% {
    background-position: 30% 30%, 70% 70%, 60% 40%, 0% 0%;
  }
  50% {
    background-position: 50% 50%, 50% 50%, 40% 60%, 0% 0%;
  }
  75% {
    background-position: 70% 70%, 30% 30%, 50% 50%, 0% 0%;
  }
}

// 动态网格
.grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 30s linear infinite;
  z-index: 0;
  pointer-events: none;
}

@keyframes gridMove {
  0% {
    transform: perspective(500px) rotateX(60deg) translateY(0);
  }
  100% {
    transform: perspective(500px) rotateX(60deg) translateY(50px);
  }
}

// 浮动粒子
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: floatUp linear infinite;
  filter: blur(1px);
}

@keyframes floatUp {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1);
    opacity: 0;
  }
}

// 光晕效果
.glow-orbs {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
  top: 10%;
  left: 10%;
  animation: orbFloat1 15s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%);
  top: 60%;
  right: 10%;
  animation: orbFloat2 18s ease-in-out infinite;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  bottom: 20%;
  left: 50%;
  animation: orbFloat3 20s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, 30px) scale(1.1);
  }
  50% {
    transform: translate(20px, 60px) scale(0.9);
  }
  75% {
    transform: translate(-30px, 40px) scale(1.05);
  }
}

@keyframes orbFloat2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-40px, -30px) scale(1.15);
  }
  66% {
    transform: translate(30px, -50px) scale(0.95);
  }
}

@keyframes orbFloat3 {
  0%, 100% {
    transform: translate(-50%, 0) scale(1);
  }
  50% {
    transform: translate(-50%, -40px) scale(1.1);
  }
}

// 内容包装器
.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
</style>
