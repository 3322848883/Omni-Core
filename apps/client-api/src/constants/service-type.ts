// Re-export ServiceType from shared constants for backward compatibility
export {
  ServiceType,
  ServiceTypeGroups,
  ServiceTypeMeta,
  PLAN_GROUPS,
  PRESET_PLANS,
  getServiceTypeLabel,
  getServiceTypeDescription,
  getServiceTypeColor,
  getServiceTypeBgColor,
  getServiceTypeIcon,
  getServiceTypePriority,
  isPremiumServiceType,
  getPlanGroupByServiceType,
  getAllServiceTypes,
  isValidServiceType,
  type PlanGroup
} from '@shared/constants/service-type';
