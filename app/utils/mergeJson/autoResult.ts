import { cloneDeep, collectLeafPaths, getByPath, setByPath, type JsonValue } from "./json";
import type { Truth } from "./pick";

export function buildAutoResultTree(jsonA: JsonValue, jsonB: JsonValue, truth: Truth): JsonValue {
    const base = cloneDeep(truth === "A" ? jsonA : jsonB);
    const other = truth === "A" ? jsonB : jsonA;

    const keys = new Set<string>([
        ...collectLeafPaths(jsonA as any),
        ...collectLeafPaths(jsonB as any),
    ]);

    for (const k of keys) {
        const cur = getByPath(base as any, k);
        if (cur === undefined) {
            const ov = getByPath(other as any, k);
            if (ov !== undefined) setByPath(base as any, k, ov);
        }
    }

    return base;
}
