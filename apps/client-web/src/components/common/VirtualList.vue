<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <div class="virtual-list-phantom" :style="phantomStyle" />
    <div class="virtual-list-content" :style="contentStyle">
      <div
        v-for="item in visibleItems"
        :key="getItemKey(item.item, item.index)"
        class="virtual-list-item"
        :style="getItemStyle(item.index)"
      >
        <slot :item="item.item" :index="item.index" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  type CSSProperties,
} from 'vue';

interface Props {
  items: T[];
  itemHeight: number;
  bufferSize?: number;
  containerHeight?: number | string;
  keyField?: string;
  dynamicHeight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5,
  containerHeight: 400,
  keyField: 'id',
  dynamicHeight: false,
});

const containerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const actualContainerHeight = ref(0);
const itemHeights = ref<Map<number, number>>(new Map());
const resizeObserver = ref<ResizeObserver | null>(null);

// 计算总高度
const totalHeight = computed(() => {
  if (props.dynamicHeight) {
    let height = 0;
    for (let i = 0; i < props.items.length; i++) {
      height += itemHeights.value.get(i) || props.itemHeight;
    }
    return height;
  }
  return props.items.length * props.itemHeight;
});

// 计算可见区域的起始索引
const startIndex = computed(() => {
  if (props.dynamicHeight) {
    return findStartIndexByHeight(scrollTop.value);
  }
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize);
});

// 计算可见区域的结束索引
const endIndex = computed(() => {
  if (props.dynamicHeight) {
    return findEndIndexByHeight(scrollTop.value + actualContainerHeight.value);
  }
  const visibleCount = Math.ceil(actualContainerHeight.value / props.itemHeight);
  return Math.min(
    props.items.length - 1,
    startIndex.value + visibleCount + props.bufferSize * 2
  );
});

// 可见项目列表
const visibleItems = computed(() => {
  const items: { item: T; index: number }[] = [];
  for (let i = startIndex.value; i <= endIndex.value && i < props.items.length; i++) {
    items.push({ item: props.items[i], index: i });
  }
  return items;
});

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  const height =
    typeof props.containerHeight === 'number'
      ? `${props.containerHeight}px`
      : props.containerHeight;
  return {
    height,
    overflow: 'auto',
    position: 'relative',
  };
});

// 占位元素样式（用于撑开滚动条）
const phantomStyle = computed<CSSProperties>(() => ({
  height: `${totalHeight.value}px`,
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: -1,
}));

// 内容区域样式
const contentStyle = computed<CSSProperties>(() => {
  const offset = props.dynamicHeight
    ? getHeightBeforeIndex(startIndex.value)
    : startIndex.value * props.itemHeight;
  return {
    transform: `translateY(${offset}px)`,
    willChange: 'transform',
  };
});

// 获取项目样式
const getItemStyle = (index: number): CSSProperties => {
  if (props.dynamicHeight) {
    return {
      minHeight: `${itemHeights.value.get(index) || props.itemHeight}px`,
    };
  }
  return {
    height: `${props.itemHeight}px`,
  };
};

// 获取项目唯一键
const getItemKey = (item: T, index: number): string | number => {
  if (props.keyField && typeof item === 'object' && item !== null) {
    const key = (item as Record<string, unknown>)[props.keyField];
    if (key !== undefined) return String(key);
  }
  return index;
};

// 处理滚动事件（使用 requestAnimationFrame 优化）
let rafId: number | null = null;
const handleScroll = () => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop;
    }
    rafId = null;
  });
};

// 动态高度相关方法
const findStartIndexByHeight = (scrollTop: number): number => {
  let accumulatedHeight = 0;
  for (let i = 0; i < props.items.length; i++) {
    const height = itemHeights.value.get(i) || props.itemHeight;
    if (accumulatedHeight + height > scrollTop) {
      return Math.max(0, i - props.bufferSize);
    }
    accumulatedHeight += height;
  }
  return 0;
};

const findEndIndexByHeight = (scrollBottom: number): number => {
  let accumulatedHeight = 0;
  for (let i = 0; i < props.items.length; i++) {
    const height = itemHeights.value.get(i) || props.itemHeight;
    accumulatedHeight += height;
    if (accumulatedHeight >= scrollBottom) {
      return Math.min(props.items.length - 1, i + props.bufferSize);
    }
  }
  return props.items.length - 1;
};

const getHeightBeforeIndex = (index: number): number => {
  let height = 0;
  for (let i = 0; i < index; i++) {
    height += itemHeights.value.get(i) || props.itemHeight;
  }
  return height;
};

// 更新项目高度（用于动态高度）
const updateItemHeight = (index: number, height: number) => {
  if (props.dynamicHeight) {
    const currentHeight = itemHeights.value.get(index);
    if (currentHeight !== height) {
      itemHeights.value.set(index, height);
    }
  }
};

// 监听容器尺寸变化
const observeContainer = () => {
  if (!containerRef.value || !window.ResizeObserver) return;

  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { height } = entry.contentRect;
      actualContainerHeight.value = height;
    }
  });

  resizeObserver.value.observe(containerRef.value);
};

// 初始化容器高度
const initContainerHeight = () => {
  if (containerRef.value) {
    actualContainerHeight.value = containerRef.value.clientHeight;
  }
};

// 滚动到指定索引
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return;

  let offset: number;
  if (props.dynamicHeight) {
    offset = getHeightBeforeIndex(index);
  } else {
    offset = index * props.itemHeight;
  }

  containerRef.value.scrollTo({
    top: offset,
    behavior,
  });
};

// 滚动到顶部
const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return;
  containerRef.value.scrollTo({ top: 0, behavior });
};

// 滚动到底部
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return;
  containerRef.value.scrollTo({ top: totalHeight.value, behavior });
};

// 监听 items 变化，重置高度缓存
watch(
  () => props.items,
  () => {
    itemHeights.value.clear();
    nextTick(() => {
      if (props.dynamicHeight) {
        measureItems();
      }
    });
  },
  { deep: true }
);

// 测量项目高度
const measureItems = () => {
  if (!containerRef.value || !props.dynamicHeight) return;

  const items = containerRef.value.querySelectorAll('.virtual-list-item');
  items.forEach((el, i) => {
    const index = startIndex.value + i;
    if (index < props.items.length) {
      updateItemHeight(index, el.getBoundingClientRect().height);
    }
  });
};

onMounted(() => {
  initContainerHeight();
  observeContainer();
  if (props.dynamicHeight) {
    nextTick(measureItems);
  }
});

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});

// 暴露方法
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  updateItemHeight,
});
</script>

<style scoped lang="scss">
.virtual-list-container {
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-list-phantom {
  pointer-events: none;
}

.virtual-list-content {
  position: relative;
}

.virtual-list-item {
  box-sizing: border-box;
}
</style>
