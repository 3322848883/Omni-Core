<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="omniGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0a0a0b" />
        <stop offset="40%" stop-color="#0EA5E9" />
        <stop offset="100%" stop-color="#8B5CF6" />
      </radialGradient>
      <filter id="omniGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Outer ring with breathing effect -->
    <circle
      cx="70"
      cy="70"
      r="65"
      stroke="#0EA5E9"
      stroke-width="0.5"
      fill="none"
      opacity="0.3"
    >
      <animate
        attributeName="r"
        values="65;68;65"
        dur="4s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        values="0.3;0.6;0.3"
        dur="4s"
        repeatCount="indefinite"
      />
    </circle>

    <!-- Rotating markers -->
    <g>
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 70 70"
        to="360 70 70"
        dur="15s"
        repeatCount="indefinite"
      />
      <path d="M 70 10 L 73 22 L 70 19 L 67 22 Z" fill="#0EA5E9" />
      <path d="M 130 70 L 118 73 L 121 70 L 118 67 Z" fill="#0EA5E9" />
      <path d="M 70 130 L 67 118 L 70 121 L 73 118 Z" fill="#0EA5E9" />
      <path d="M 10 70 L 22 67 L 19 70 L 22 73 Z" fill="#0EA5E9" />
    </g>

    <!-- Pupil with pulse -->
    <circle cx="70" cy="70" r="35" fill="url(#omniGrad)" filter="url(#omniGlow)">
      <animate
        attributeName="r"
        values="35;38;35"
        dur="3s"
        repeatCount="indefinite"
      />
    </circle>

    <!-- Inner core -->
    <circle cx="70" cy="70" r="12" fill="#0a0a0b">
      <animate
        attributeName="r"
        values="12;14;12"
        dur="3s"
        repeatCount="indefinite"
      />
    </circle>

    <!-- Highlight with shimmer -->
    <circle cx="74" cy="66" r="4" fill="#fff" opacity="0.8">
      <animate
        attributeName="opacity"
        values="0.8;1;0.8"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>

    <!-- Additional orbiting particles -->
    <g>
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 70 70"
        to="360 70 70"
        dur="8s"
        repeatCount="indefinite"
      />
      <circle cx="70" cy="40" r="1.5" fill="#0EA5E9" opacity="0.5" />
      <circle cx="100" cy="70" r="1.5" fill="#8B5CF6" opacity="0.5" />
      <circle cx="70" cy="100" r="1.5" fill="#0EA5E9" opacity="0.5" />
      <circle cx="40" cy="70" r="1.5" fill="#8B5CF6" opacity="0.5" />
    </g>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number;
}

withDefaults(defineProps<Props>(), {
  size: 140,
});
</script>
