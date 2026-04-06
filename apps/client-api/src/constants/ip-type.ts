// IP Type Constants

export enum IpType {
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
}

export enum LineType {
  STANDARD = 'standard',
  DEDICATED = 'dedicated',
  EXCLUSIVE = 'exclusive',
  RESIDENTIAL = 'residential',
}

export enum ISP {
  CHINA_TELECOM = 'china_telecom',
  CHINA_UNICOM = 'china_unicom',
  CHINA_MOBILE = 'china_mobile',
  OTHER = 'other',
}

export const IpTypeMeta: Record<IpType, { label: string; description: string }> = {
  [IpType.IPV4]: {
    label: 'IPv4',
    description: 'Internet Protocol version 4',
  },
  [IpType.IPV6]: {
    label: 'IPv6',
    description: 'Internet Protocol version 6',
  },
};

export const LineTypeMeta: Record<LineType, { label: string; description: string }> = {
  [LineType.STANDARD]: {
    label: '标准线路',
    description: '标准网络线路',
  },
  [LineType.DEDICATED]: {
    label: '专线',
    description: '专用网络线路，低延迟',
  },
  [LineType.EXCLUSIVE]: {
    label: '独享线路',
    description: '独享带宽线路',
  },
  [LineType.RESIDENTIAL]: {
    label: '住宅线路',
    description: '住宅IP线路',
  },
};

export const ISPMeta: Record<ISP, { label: string; description: string }> = {
  [ISP.CHINA_TELECOM]: {
    label: '中国电信',
    description: 'China Telecom',
  },
  [ISP.CHINA_UNICOM]: {
    label: '中国联通',
    description: 'China Unicom',
  },
  [ISP.CHINA_MOBILE]: {
    label: '中国移动',
    description: 'China Mobile',
  },
  [ISP.OTHER]: {
    label: '其他',
    description: 'Other ISP',
  },
};

// Re-export from shared
export * from '@shared/constants/ip-type';
