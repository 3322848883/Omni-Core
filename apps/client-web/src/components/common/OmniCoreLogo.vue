<template>
  <div class="omnicore-logo" :class="{ 'with-text': showText }">
    <svg
      :width="logoSize"
      :height="logoSize"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg"
    >
      <defs>
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00f5ff" />
          <stop offset="50%" stop-color="#b829dd" />
          <stop offset="100%" stop-color="#ff00ff" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background circle -->
      <circle
        cx="200"
        cy="200"
        r="180"
        fill="#0a0a0f"
        opacity="0.5"
      />

      <!-- Liquid O -->
      <path
        d="M120 120
           C120 90, 160 90, 160 120
           C160 140, 150 160, 140 180
           C130 200, 120 220, 120 240
           C120 270, 160 270, 160 240
           C160 220, 150 200, 140 180"
        fill="none"
        stroke="url(#liquidGrad)"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        filter="url(#glow)"
      />

      <!-- Liquid C connected -->
      <path
        d="M180 130
           C220 110, 260 130, 260 170
           C260 210, 220 230, 190 220"
        fill="none"
        stroke="#e0e0ff"
        :stroke-width="strokeWidth * 0.85"
        stroke-linecap="round"
        filter="url(#glow)"
      />

      <!-- Animated Drips -->
      <circle cx="140" cy="270" r="5" fill="#00f5ff">
        <animate
          attributeName="cy"
          values="270;280;270"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="190" cy="235" r="4" fill="#e0e0ff" opacity="0.8">
        <animate
          attributeName="cy"
          values="235;245;235"
          dur="2.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;0;0.8"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </circle>

      <!-- Splash effect -->
      <path
        d="M260 170 L275 162 M260 170 L278 170 M260 170 L275 178"
        stroke="#b829dd"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.6"
      />

      <!-- Additional decorative drips -->
      <circle cx="130" cy="200" r="3" fill="#00f5ff" opacity="0.4">
        <animate
          attributeName="cy"
          values="200;220;200"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="250" cy="180" r="2" fill="#b829dd" opacity="0.3">
        <animate
          attributeName="cy"
          values="180;200;180"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>

    <!-- Text version -->
    <div v-if="showText" class="logo-text">
      <span class="text-omni">Omni</span>
      <span class="text-core">Core</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: number;
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 80,
  showText: false,
});

const logoSize = props.size;
const strokeWidth = (props.size / 400) * 12;
</script>

<style scoped lang="scss">
.omnicore-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;

  &.with-text {
    flex-direction: column;
    gap: 8px;
  }
}

.logo-svg {
  filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.3));
}

.logo-text {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 700;

  .text-omni {
    background: linear-gradient(135deg, #00f5ff, #b829dd, #ff00ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .text-core {
    color: #e0e0ff;
    font-weight: 300;
  }
}
</style>
