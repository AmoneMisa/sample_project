export type ServiceType = {
    id: string;
    titleKey: string;
    descriptionKey: string;
    link: string | null;
    image: string | null;
    category: string;
    order: number;
    isVisible: boolean;
    createdAt: string;
}
