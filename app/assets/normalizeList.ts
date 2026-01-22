export default function(value: any) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
            } catch {}
        }

        if (trimmed.includes(";")) {
            return trimmed.split(";").map(s => s.trim()).filter(Boolean);
        }

        if (trimmed.includes(",")) {
            return trimmed.split(",").map(s => s.trim()).filter(Boolean);
        }

        return [trimmed];
    }

    return [];
}
