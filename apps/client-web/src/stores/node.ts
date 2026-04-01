// Node Store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as nodeApi from '@/api/node';
import type { Node, NodeConfig, NodeListParams } from '@/types/node';

export const useNodeStore = defineStore('node', () => {
  // State
  const nodes = ref<Node[]>([]);
  const currentNode = ref<Node | null>(null);
  const nodeConfig = ref<NodeConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const onlineNodes = computed(() => nodes.value.filter((n: Node) => n.status === 'online'));

  const sortedNodes = computed(() => {
    return [...nodes.value].sort((a: Node, b: Node) => {
      // Online status first
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      // Lower latency first
      return (a.latency || Infinity) - (b.latency || Infinity);
    });
  });

  // Actions
  async function fetchNodes(params?: NodeListParams) {
    loading.value = true;
    error.value = null;

    try {
      const response = await nodeApi.getNodeList(params);
      nodes.value = response.items;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch nodes';
    } finally {
      loading.value = false;
    }
  }

  async function fetchNodeConfig(nodeId: string) {
    loading.value = true;

    try {
      const response = await nodeApi.getNodeConfig(nodeId);
      nodeConfig.value = response;
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function testLatency(nodeId: string) {
    const node = nodes.value.find((n: Node) => n.id === nodeId);
    if (!node) return;

    node.testing = true;

    try {
      const response = await nodeApi.testNodeLatency(nodeId);
      node.latency = response.latency;
    } finally {
      node.testing = false;
    }
  }

  function selectNode(node: Node) {
    currentNode.value = node;
  }

  return {
    nodes,
    currentNode,
    nodeConfig,
    loading,
    error,
    onlineNodes,
    sortedNodes,
    fetchNodes,
    fetchNodeConfig,
    testLatency,
    selectNode,
  };
});
