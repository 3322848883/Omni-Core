// Type declarations for shared modules

declare module '@shared/constants/service-type.mjs' {
  export enum ServiceType {
    STANDARD = 'standard',
    DEDICATED_LINE = 'dedicated_line',
    EXCLUSIVE = 'exclusive',
    STATIC_RESIDENTIAL = 'static_residential',
    DYNAMIC_RESIDENTIAL = 'dynamic_residential',
    ENTERPRISE = 'enterprise'
  }

  export enum IpType {
    DATACENTER = 'datacenter',
    STATIC_RESIDENTIAL = 'static_residential',
    DYNAMIC_RESIDENTIAL = 'dynamic_residential'
  }

  export enum LineType {
    STANDARD = 'standard',
    CN2 = 'cn2',
    IEPL = 'iepl',
    IPLC = 'iplc'
  }

  export enum RotationStrategy {
    FIXED = 'fixed',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    ON_DEMAND = 'on_demand',
    ROUND_ROBIN = 'round_robin',
    RANDOM = 'random',
    LEAST_USED = 'least_used',
    QUALITY_FIRST = 'quality_first'
  }

  export const SERVICE_TYPE_LABELS: Record<ServiceType, string>;
  export const SERVICE_TYPE_DESCRIPTIONS: Record<ServiceType, string>;
  export const SERVICE_TYPE_ICONS: Record<ServiceType, string>;
  export const SERVICE_TYPE_COLORS: Record<ServiceType, string>;
  export const SERVICE_TYPE_PRIORITIES: Record<ServiceType, number>;

  // Helper functions
  export function getServiceTypeLabel(type: ServiceType): string;
  export function getServiceTypeDescription(type: ServiceType): string;
  export function getServiceTypeIcon(type: ServiceType): string;
  export function getServiceTypeColor(type: ServiceType): string;
  export function getServiceTypeBgColor(type: ServiceType): string;
  export function getAllServiceTypes(): ServiceType[];

  // Preset plans
  export interface PresetPlan {
    id: string;
    name: string;
    description: string;
    serviceType: ServiceType;
    trafficLimit: number;
    durationDays: number;
    price: number;
    currency: string;
    features: string[];
  }

  export const PRESET_PLANS: PresetPlan[];

  // Service type meta
  export interface ServiceTypeMeta {
    type: ServiceType;
    label: string;
    description: string;
    icon: string;
    color: string;
    priority: number;
  }

  export function getServiceTypeMeta(type: ServiceType): ServiceTypeMeta;
}
