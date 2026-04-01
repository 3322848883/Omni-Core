// Subscription Store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as subscriptionApi from '@/api/subscription';
import type { SubscriptionInfo, Plan } from '@/types/subscription';

export const useSubscriptionStore = defineStore('subscription', () => {
  // State
  const currentSubscription = ref<SubscriptionInfo | null>(null);
  const plans = ref<Plan[]>([]);
  const loading = ref(false);

  // Getters
  const usagePercent = computed(() => {
    if (!currentSubscription.value) return 0;
    return Math.round(
      (currentSubscription.value.trafficUsed / currentSubscription.value.trafficLimit) * 100
    );
  });

  const isExpiringSoon = computed(() => {
    if (!currentSubscription.value) return false;
    return currentSubscription.value.daysRemaining <= 7;
  });

  const isTrafficWarning = computed(() => {
    return usagePercent.value >= 80;
  });

  // Actions
  async function fetchCurrentSubscription() {
    loading.value = true;
    try {
      const response = await subscriptionApi.getCurrentSubscription() as unknown as SubscriptionInfo;
      currentSubscription.value = response;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPlans() {
    loading.value = true;
    try {
      const response = await subscriptionApi.getPlanList() as unknown as Plan[];
      plans.value = response;
    } finally {
      loading.value = false;
    }
  }

  return {
    currentSubscription,
    plans,
    loading,
    usagePercent,
    isExpiringSoon,
    isTrafficWarning,
    fetchCurrentSubscription,
    fetchPlans,
  };
});
