import { ref, computed } from 'vue';

interface TableOptions<T> {
  defaultSort?: { prop: keyof T; order: 'ascending' | 'descending' };
}

export function useTable<T>(options: TableOptions<T> = {}) {
  const { defaultSort } = options;

  const items = ref<T[]>([]);
  const loading = ref(false);
  const selectedItems = ref<T[]>([]);
  const sort = ref(defaultSort);

  const isEmpty = computed(() => items.value.length === 0);
  const hasSelection = computed(() => selectedItems.value.length > 0);

  const setItems = (data: T[]) => {
    items.value = data;
  };

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const setSelection = (selection: T[]) => {
    selectedItems.value = selection;
  };

  const clearSelection = () => {
    selectedItems.value = [];
  };

  const handleSortChange = (sortInfo: { prop: keyof T; order: string }) => {
    sort.value = {
      prop: sortInfo.prop,
      order: sortInfo.order as 'ascending' | 'descending',
    };
  };

  return {
    items,
    loading,
    selectedItems,
    sort,
    isEmpty,
    hasSelection,
    setItems,
    setLoading,
    setSelection,
    clearSelection,
    handleSortChange,
  };
}
