export async function safeFetch<T>(url: string, opts: any = {}): Promise<{ data: T | null, error: any | null }> {
    try {
        const data = await $fetch<T>(url, opts);
        return { data, error: null };
    } catch (err: any) {
        console.error("Fetch error:", err);
        return { data: null, error: err };
    }
}
