import { collectLeafPaths, getByPath, setByPath } from "./json";

export function deleteByPath(root: any, path: string) {
    const parts = path.split(".").filter(Boolean);
    if (!parts.length) return;
    const last = parts.pop()!;
    const parent = getByPath(root, parts.join("."));
    if (parent && typeof parent === "object") delete parent[last];
}

export function movePrefix(root: any, fromPrefix: string, toPrefix: string) {
    const keys = collectLeafPaths(root);
    const affected = keys.filter((k) => k === fromPrefix || k.startsWith(fromPrefix + "."));

    for (const k of affected) {
        const v = getByPath(root, k);
        const rest = k === fromPrefix ? "" : k.slice(fromPrefix.length + 1);
        const nk = rest ? `${toPrefix}.${rest}` : toPrefix;

        setByPath(root, nk, v);
        deleteByPath(root, k);
    }
}
