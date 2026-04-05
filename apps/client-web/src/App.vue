<template>
  <div class="omniverse">
    <div class="neon-grid"></div>
    <div class="cyber-sphere"></div>
    <div class="cyber-cubes"></div>
    <div class="noise-overlay"></div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.omniverse {
  position: relative;
  min-height: 100vh;
  background: #050508;
  overflow: hidden;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  perspective: 1000px;
}

.neon-grid {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 1;
  animation: grid-move 20s linear infinite;
  transform-style: preserve-3d;
  transform: translateZ(-100px);
}

@keyframes grid-move {
  0% {
    transform: translateZ(-100px) translate(0, 0);
  }
  100% {
    transform: translateZ(-100px) translate(50px, 50px);
  }
}

/* 3D 赛博球体效果 */
.cyber-sphere {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
  pointer-events: none;
  z-index: 2;
  transform-style: preserve-3d;
  animation: sphere-rotate 20s linear infinite;
}

.cyber-sphere::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.2), rgba(236, 72, 153, 0.1), transparent);
  box-shadow: 
    0 0 50px rgba(59, 130, 246, 0.3),
    0 0 100px rgba(236, 72, 153, 0.2),
    inset 0 0 50px rgba(59, 130, 246, 0.1);
  animation: sphere-pulse 4s ease-in-out infinite;
}

@keyframes sphere-rotate {
  0% {
    transform: rotateY(0deg) rotateX(15deg);
  }
  100% {
    transform: rotateY(360deg) rotateX(15deg);
  }
}

@keyframes sphere-pulse {
  0%, 100% {
    box-shadow: 
      0 0 50px rgba(59, 130, 246, 0.3),
      0 0 100px rgba(236, 72, 153, 0.2),
      inset 0 0 50px rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 
      0 0 70px rgba(59, 130, 246, 0.4),
      0 0 140px rgba(236, 72, 153, 0.3),
      inset 0 0 70px rgba(59, 130, 246, 0.15);
  }
}

/* 3D 立方体效果 */
.cyber-cubes {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
  transform-style: preserve-3d;
}

.cyber-cubes::before,
.cyber-cubes::after {
  content: '';
  position: absolute;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(236, 72, 153, 0.3));
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  animation: cube-float 6s ease-in-out infinite;
}

.cyber-cubes::before {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
  transform: rotateX(45deg) rotateY(30deg);
}

.cyber-cubes::after {
  top: 70%;
  right: 15%;
  animation-delay: 2s;
  transform: rotateX(30deg) rotateY(60deg);
}

@keyframes cube-float {
  0%, 100% {
    transform: rotateX(45deg) rotateY(30deg) translateY(0px) translateZ(0px);
    opacity: 0.6;
  }
  50% {
    transform: rotateX(60deg) rotateY(45deg) translateY(-20px) translateZ(50px);
    opacity: 0.9;
  }
}

.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  z-index: 3;
}

#app {
  position: relative;
  z-index: 10;
  transform-style: preserve-3d;
}

/* 3D 卡片悬停效果 */
.page-content,
.el-card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.page-content:hover,
.el-card:hover {
  transform: translateY(-5px) rotateX(2deg) rotateY(2deg);
}

/* 3D 按钮效果 */
.el-button {
  transform-style: preserve-3d;
  transition: all 0.3s ease;
  transform: translateZ(0px);
}

.el-button:hover {
  transform: translateY(-3px) translateZ(10px);
}

/* 3D 文本效果 */
.gradient-text {
  transform-style: preserve-3d;
  text-shadow: 
    0 0 10px rgba(59, 130, 246, 0.5),
    0 0 20px rgba(236, 72, 153, 0.3),
    0 0 30px rgba(59, 130, 246, 0.2);
  animation: text-glow 2s ease-in-out infinite;
}

@keyframes text-glow {
  0%, 100% {
    text-shadow: 
      0 0 10px rgba(59, 130, 246, 0.5),
      0 0 20px rgba(236, 72, 153, 0.3),
      0 0 30px rgba(59, 130, 246, 0.2);
  }
  50% {
    text-shadow: 
      0 0 15px rgba(59, 130, 246, 0.7),
      0 0 30px rgba(236, 72, 153, 0.5),
      0 0 45px rgba(59, 130, 246, 0.3);
  }
}
</style>