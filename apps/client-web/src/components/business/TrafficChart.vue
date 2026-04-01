<template>
  <div class="traffic-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import type { TrafficStats } from '@/types/traffic';

interface Props {
  data: TrafficStats[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;

  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart || !props.data.length) return;

  const dates = props.data.map((item) => item.date);
  const uploads = props.data.map((item) =>
    parseFloat((item.upload / 1024 / 1024 / 1024).toFixed(2))
  );
  const downloads = props.data.map((item) =>
    parseFloat((item.download / 1024 / 1024 / 1024).toFixed(2))
  );

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const p = params as Array<{ axisValue: string; seriesName: string; value: number; color: string }>;
        let result = `<div style="font-weight:600;margin-bottom:5px">${p[0].axisValue}</div>`;
        p.forEach((param) => {
          result += `<div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color}"></span>
            <span>${param.seriesName}:</span>
            <span style="font-weight:600">${param.value} GB</span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: ['上传', '下载'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' },
    },
    yAxis: {
      type: 'value',
      name: '流量 (GB)',
      nameTextStyle: { color: '#606266' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#606266' },
      splitLine: { lineStyle: { color: '#ebeef5' } },
    },
    series: [
      {
        name: '上传',
        type: 'bar',
        stack: 'total',
        data: uploads,
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
        barWidth: '40%',
      },
      {
        name: '下载',
        type: 'bar',
        stack: 'total',
        data: downloads,
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
        barWidth: '40%',
      },
    ],
  });
};

watch(() => props.data, updateChart, { deep: true });

onMounted(() => {
  initChart();
  window.addEventListener('resize', () => chart?.resize());
});

onUnmounted(() => {
  chart?.dispose();
  window.removeEventListener('resize', () => chart?.resize());
});
</script>

<style scoped lang="scss">
.traffic-chart {
  width: 100%;

  .chart-container {
    width: 100%;
    height: 300px;
  }
}
</style>
