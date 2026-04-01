// Type declarations for service-type.mjs

export enum ServiceType {
  VPN_BASIC = 'vpn_basic',
  VPN_PREMIUM = 'vpn_premium',
  VPN_ENTERPRISE = 'vpn_enterprise',
  DEDICATED_LINE = 'dedicated_line',
  CN2_LINE = 'cn2_line',
  IEPL_LINE = 'iepl_line',
  IPLC_LINE = 'iplc_line',
  STATIC_IP = 'static_ip',
  RESIDENTIAL_STATIC = 'residential_static',
  DYNAMIC_IP = 'dynamic_ip',
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',
  CUSTOM = 'custom',
  TRIAL = 'trial'
}

export const ServiceTypeMeta: Record<ServiceType, {
  label: string;
  description: string;
  features: string[];
  category: string;
}>;

export function getServiceTypeLabel(type: ServiceType): string;
export function getServiceTypeDescription(type: ServiceType): string;
export function getServiceTypeFeatures(type: ServiceType): string[];
export function getServiceTypeCategory(type: ServiceType): string;
export function isValidServiceType(type: string): type is ServiceType;
export function getAllServiceTypes(): ServiceType[];
export function getServiceTypesByCategory(category: string): ServiceType[];
