import { collectLeafPaths, getByPath } from "./json";
import type { JsonValue } from "./json";

export type Status = "same" | "diff" | "onlyA" | "onlyB";

export function leafStatus(aRoot: JsonValue, bRoot: JsonValue, path: string): Status {
    const a = getByPath(aRoot as any, path);
    const b = getByPath(bRoot as any, path);

    const hasA = a !== undefined;
    const hasB = b !== undefined;

    if (hasA && !hasB) return "onlyA";
    if (!hasA && hasB) return "onlyB";

    const sa = a == null ? "" : String(a);
    const sb = b == null ? "" : String(b);
    return sa === sb ? "same" : "diff";
}

export function makeDiffSet(aRoot: JsonValue, bRoot: JsonValue) {
    const set = new Set<string>();
    const keys = new Set<string>([
        ...collectLeafPaths(aRoot as any),
        ...collectLeafPaths(bRoot as any),
    ]);
    for (const k of keys) {
        if (!k) continue;
        if (leafStatus(aRoot, bRoot, k) !== "same") set.add(k);
    }
    return set;
}
