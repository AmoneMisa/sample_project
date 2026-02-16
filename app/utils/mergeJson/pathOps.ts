import { collectLeafPaths, getByPath, setByPath } from "./json";

export function deleteByPath(root: any, path: string) {
    const parts = path.split(".").filter(Boolean);
    if (!parts.length) return;
    const last = parts.pop()!;
    const parent = getByPath(root, parts.join("."));
    if (parent && typeof parent === "object") delete parent[last];
}

