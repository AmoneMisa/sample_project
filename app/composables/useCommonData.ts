export const useHeaderMenu = () => useState<any>('header-menu', () => null);
export const useFooterBlocks = () => useState<any>('footer-blocks', () => null);
export const useContacts = () => useState<any>('contacts', () => null);

export const useTranslationsLoaded = () =>
    useState<Set<string>>('translations-loaded', () => new Set<string>());
