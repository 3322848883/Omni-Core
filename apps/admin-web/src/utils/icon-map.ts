/**
 * 图标映射工具
 * 将服务类型中的图标名称映射到 Element Plus 图标组件
 */
import {
  Promotion,
  Medal,
  Lock,
  Star,
  Lightning,
  Trophy,
  Flag,
  Location,
  Compass,
  CircleCheck,
  CircleClose,
  HomeFilled,
} from '@element-plus/icons-vue';
import type { Component } from 'vue';

// 服务类型图标映射
export const serviceTypeIconMap: Record<string, Component> = {
  plane: Promotion,
  crown: Medal,
  shield: Lock,
  star: Star,
  lightning: Lightning,
  trophy: Trophy,
  medal: Medal,
  flag: Flag,
  location: Location,
  compass: Compass,
  circleCheck: CircleCheck,
  circleClose: CircleClose,
  home: HomeFilled,
};

/**
 * 获取图标组件
 * @param iconName 图标名称
 * @returns 图标组件
 */
export function getIconComponent(iconName: string): Component {
  return serviceTypeIconMap[iconName] || Promotion;
}
