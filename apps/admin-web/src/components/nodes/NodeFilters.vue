<template>
  <div class="node-filters">
    <el-form :model="filters" inline>
      <el-form-item label="关键词">
        <el-input
          v-model="filters.keyword"
          placeholder="节点名称/主机"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item label="服务类型">
        <el-select
          v-model="filters.serviceTypes"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="全部"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="type in serviceTypes"
            :key="type"
            :label="getServiceTypeLabel(type)"
            :value="type"
          >
            <div class="service-type-option">
              <span
                class="type-dot"
                :style="{ backgroundColor: getServiceTypeColor(type) }"
              />
              <span>{{ getServiceTypeLabel(type) }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="IP类型">
        <el-select
          v-model="filters.ipType"
          placeholder="全部"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="type in ipTypeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          >
            <div class="ip-type-option">
              <el-icon :size="14">
                <component :is="type.icon" />
              </el-icon>
              <span>{{ type.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="线路类型">
        <el-select
          v-model="filters.lineType"
          placeholder="全部"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="line in lineTypeOptions"
            :key="line.value"
            :label="line.label"
            :value="line.value"
          >
            <span>{{ line.label }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="ISP">
        <el-select
          v-model="filters.isp"
          placeholder="全部"
          clearable
          filterable
          style="width: 150px"
        >
          <el-option
            v-for="isp in ispOptions"
            :key="isp.code"
            :label="isp.name"
            :value="isp.code"
          >
            <div class="isp-option">
              <span>{{ isp.name }}</span>
              <el-tag size="small" type="info">{{ isp.country }}</el-tag>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="最低评分">
        <el-select v-model="filters.minIpScore" placeholder="全部" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="≥ 90 (优秀)" :value="90" />
          <el-option label="≥ 70 (良好)" :value="70" />
          <el-option label="≥ 50 (一般)" :value="50" />
        </el-select>
      </el-form-item>

      <el-form-item label="QoS等级">
        <el-select v-model="filters.qosLevel" placeholder="全部" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="1-2 (基础)" :value="1" />
          <el-option label="3-4 (标准)" :value="3" />
          <el-option label="5 (高级)" :value="5" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100px">
          <el-option label="活跃" :value="1" />
          <el-option label="离线" :value="2" />
          <el-option label="维护中" :value="3" />
        </el-select>
      </el-form-item>

      <el-form-item label="协议">
        <el-select v-model="filters.protocol" placeholder="全部" clearable style="width: 120px">
          <el-option label="VMess" value="vmess" />
          <el-option label="VLESS" value="vless" />
          <el-option label="Trojan" value="trojan" />
          <el-option label="Shadowsocks" value="shadowsocks" />
        </el-select>
      </el-form-item>

      <el-form-item label="负载状态">
        <el-select v-model="filters.loadStatus" placeholder="全部" clearable style="width: 120px">
          <el-option label="空闲" value="idle" />
          <el-option label="正常" value="normal" />
          <el-option label="繁忙" value="busy" />
          <el-option label="满载" value="full" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- Active Filters Tags -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="filter-label">已选筛选:</span>
      <el-tag
        v-if="filters.keyword"
        closable
        @close="filters.keyword = ''"
        size="small"
        class="filter-tag"
      >
        关键词: {{ filters.keyword }}
      </el-tag>
      <el-tag
        v-for="type in filters.serviceTypes"
        :key="type"
        closable
        @close="removeServiceType(type)"
        size="small"
        class="filter-tag"
        :style="{ backgroundColor: getServiceTypeBgColor(type), color: getServiceTypeColor(type) }"
      >
        {{ getServiceTypeLabel(type) }}
      </el-tag>
      <el-tag
        v-if="filters.ipType"
        closable
        @close="filters.ipType = undefined"
        size="small"
        class="filter-tag"
      >
        IP类型: {{ getIpTypeLabel(filters.ipType) }}
      </el-tag>
      <el-tag
        v-if="filters.lineType"
        closable
        @close="filters.lineType = undefined"
        size="small"
        class="filter-tag"
      >
        线路: {{ getLineTypeLabel(filters.lineType) }}
      </el-tag>
      <el-tag
        v-if="filters.isp"
        closable
        @close="filters.isp = undefined"
        size="small"
        class="filter-tag"
      >
        ISP: {{ getIspLabel(filters.isp) }}
      </el-tag>
      <el-tag
        v-if="filters.minIpScore"
        closable
        @close="filters.minIpScore = undefined"
        size="small"
        class="filter-tag"
      >
        评分: ≥{{ filters.minIpScore }}
      </el-tag>
      <el-tag
        v-if="filters.qosLevel"
        closable
        @close="filters.qosLevel = undefined"
        size="small"
        class="filter-tag"
      >
        QoS: {{ getQosLabel(filters.qosLevel) }}
      </el-tag>
      <el-tag
        v-if="filters.status"
        closable
        @close="filters.status = undefined"
        size="small"
        class="filter-tag"
      >
        状态: {{ getStatusLabel(filters.status) }}
      </el-tag>
      <el-tag
        v-if="filters.protocol"
        closable
        @close="filters.protocol = undefined"
        size="small"
        class="filter-tag"
      >
        协议: {{ filters.protocol.toUpperCase() }}
      </el-tag>
      <el-tag
        v-if="filters.loadStatus"
        closable
        @close="filters.loadStatus = undefined"
        size="small"
        class="filter-tag"
      >
        负载: {{ getLoadStatusLabel(filters.loadStatus) }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue';
import { Search, RefreshRight } from '@element-plus/icons-vue';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  getServiceTypeBgColor,
} from '@shared/constants/service-type.mjs';
import { IpType, LineType, type IpMetadata } from '../../types/node';
import { getIpMetadata } from '@api/nodes';

interface FilterState {
  keyword?: string;
  serviceTypes: ServiceType[];
  ipType?: IpType;
  lineType?: LineType;
  isp?: string;
  minIpScore?: number;
  qosLevel?: number;
  status?: number;
  protocol?: string;
  loadStatus?: string;
}

const props = defineProps<{
  modelValue: FilterState;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FilterState];
  search: [];
  reset: [];
}>();

const filters = reactive<FilterState>({ ...props.modelValue });

const serviceTypes = getAllServiceTypes();

// IP type options
const ipTypeOptions = reactive<IpMetadata['ipTypes']>([
  { value: IpType.DATACENTER, label: '机房', description: '数据中心IP', icon: 'OfficeBuilding' },
  { value: IpType.DYNAMIC_RESIDENTIAL, label: '动态住宅', description: '动态轮换住宅IP', icon: 'Refresh' },
  { value: IpType.STATIC_RESIDENTIAL, label: '静态住宅', description: '固定住宅IP', icon: 'HomeFilled' },
  { value: IpType.MOBILE, label: '移动', description: '移动网络IP', icon: 'Iphone' },
]);

// Line type options
const lineTypeOptions = reactive<IpMetadata['lineTypes']>([
  { value: LineType.STANDARD, label: '标准线路', description: '普通国际线路', priority: 1 },
  { value: LineType.CN2, label: 'CN2', description: '中国电信CN2优质线路', priority: 2 },
  { value: LineType.IEPL, label: 'IEPL', description: '国际以太网专线', priority: 3 },
  { value: LineType.IPLC, label: 'IPLC', description: '国际私人租用线路', priority: 4 },
]);

// ISP options
const ispOptions = reactive<IpMetadata['isps']>([
  { code: 'starlink', name: 'Starlink', country: 'US', type: 'isp' },
  { code: 'comcast', name: 'Comcast', country: 'US', type: 'isp' },
  { code: 'att', name: 'AT&T', country: 'US', type: 'isp' },
  { code: 'verizon', name: 'Verizon', country: 'US', type: 'isp' },
  { code: 'tmobile', name: 'T-Mobile', country: 'US', type: 'mobile' },
  { code: 'chinamobile', name: '中国移动', country: 'CN', type: 'mobile' },
  { code: 'chinatelecom', name: '中国电信', country: 'CN', type: 'isp' },
  { code: 'chinaunicom', name: '中国联通', country: 'CN', type: 'isp' },
  { code: 'ntt', name: 'NTT', country: 'JP', type: 'isp' },
  { code: 'softbank', name: 'SoftBank', country: 'JP', type: 'isp' },
  { code: 'singtel', name: 'Singtel', country: 'SG', type: 'isp' },
  { code: 'digitalocean', name: 'DigitalOcean', country: 'US', type: 'datacenter' },
  { code: 'aws', name: 'AWS', country: 'US', type: 'datacenter' },
  { code: 'gcp', name: 'Google Cloud', country: 'US', type: 'datacenter' },
  { code: 'azure', name: 'Azure', country: 'US', type: 'datacenter' },
  { code: 'aliyun', name: '阿里云', country: 'CN', type: 'datacenter' },
  { code: 'tencent', name: '腾讯云', country: 'CN', type: 'datacenter' },
]);

const hasActiveFilters = computed(() => {
  return (
    filters.keyword ||
    filters.serviceTypes.length > 0 ||
    filters.ipType !== undefined ||
    filters.lineType !== undefined ||
    filters.isp !== undefined ||
    filters.minIpScore !== undefined ||
    filters.qosLevel !== undefined ||
    filters.status !== undefined ||
    filters.protocol ||
    filters.loadStatus
  );
});

const removeServiceType = (type: ServiceType) => {
  const index = filters.serviceTypes.indexOf(type);
  if (index > -1) {
    filters.serviceTypes.splice(index, 1);
  }
};

const getIpTypeLabel = (type: IpType): string => {
  const option = ipTypeOptions.find(o => o.value === type);
  return option?.label || type;
};

const getLineTypeLabel = (type: LineType): string => {
  const option = lineTypeOptions.find(o => o.value === type);
  return option?.label || type;
};

const getIspLabel = (code: string): string => {
  const isp = ispOptions.find(i => i.code === code);
  return isp?.name || code;
};

const getQosLabel = (level: number): string => {
  const labels: Record<number, string> = {
    1: '1-2 (基础)',
    3: '3-4 (标准)',
    5: '5 (高级)',
  };
  return labels[level] || String(level);
};

const getStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    1: '活跃',
    2: '离线',
    3: '维护中',
  };
  return labels[status] || '未知';
};

const getLoadStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    idle: '空闲',
    normal: '正常',
    busy: '繁忙',
    full: '满载',
  };
  return labels[status] || status;
};

const handleSearch = () => {
  emit('update:modelValue', { ...filters });
  emit('search');
};

const handleReset = () => {
  filters.keyword = '';
  filters.serviceTypes = [];
  filters.ipType = undefined;
  filters.lineType = undefined;
  filters.isp = undefined;
  filters.minIpScore = undefined;
  filters.qosLevel = undefined;
  filters.status = undefined;
  filters.protocol = undefined;
  filters.loadStatus = undefined;
  emit('update:modelValue', { ...filters });
  emit('reset');
};

const fetchMetadata = async () => {
  try {
    const metadata = await getIpMetadata();
    if (metadata.ipTypes) {
      ipTypeOptions.splice(0, ipTypeOptions.length, ...metadata.ipTypes);
    }
    if (metadata.lineTypes) {
      lineTypeOptions.splice(0, lineTypeOptions.length, ...metadata.lineTypes);
    }
    if (metadata.isps) {
      ispOptions.splice(0, ispOptions.length, ...metadata.isps);
    }
  } catch (error) {
    console.warn('Failed to fetch IP metadata, using defaults');
  }
};

onMounted(() => {
  fetchMetadata();
});
</script>

<style scoped lang="scss">
.node-filters {
  margin-bottom: 16px;

  .service-type-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .type-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }

  .ip-type-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .isp-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .active-filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #dcdfe6;

    .filter-label {
      font-size: 13px;
      color: #909399;
    }

    .filter-tag {
      margin-right: 0;
    }
  }
}
</style>
