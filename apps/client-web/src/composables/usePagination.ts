import { ref, computed } from 'vue';

interface PaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export function usePagination(options: PaginationOptions = {}) {
  const {
    defaultPage = 1,
    defaultPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
  } = options;

  const currentPage = ref(defaultPage);
  const pageSize = ref(defaultPageSize);
  const total = ref(0);

  const paginationParams = computed(() => ({
    page: currentPage.value,
    limit: pageSize.value,
  }));

  const setPage = (page: number) => {
    currentPage.value = page;
  };

  const setPageSize = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
  };

  const setTotal = (value: number) => {
    total.value = value;
  };

  const reset = () => {
    currentPage.value = defaultPage;
    pageSize.value = defaultPageSize;
    total.value = 0;
  };

  return {
    currentPage,
    pageSize,
    total,
    pageSizeOptions,
    paginationParams,
    setPage,
    setPageSize,
    setTotal,
    reset,
  };
}
