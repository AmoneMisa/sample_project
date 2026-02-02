export default interface Testimonial {
    id: number;
    name: string;
    role: string;
    quote: string;
    avatar?: string;
    logo?: string;
    rating: number;
    order?: number;
    isVisible: boolean;
}