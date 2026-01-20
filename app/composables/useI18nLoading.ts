export const useI18nLoadingCount = () => useState<number>('i18n-loading-count', () => 0);
export const useI18nLoading = () => computed(() => useI18nLoadingCount().value > 0);