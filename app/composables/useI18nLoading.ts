export const useI18nLoadingCount = () =>
    useState('i18n-loading-count', () => 0);

export const useI18nLoading = () =>
    computed(() => useI18nLoadingCount().value > 0);

export const startI18nLoading = () => {
    useI18nLoadingCount().value++;
}

export const finishI18nLoading = () => {
    const c = useI18nLoadingCount();
    c.value = Math.max(0, c.value - 1);
}
