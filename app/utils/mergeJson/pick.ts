import { getByPath } from "./json";

export type Pick = "AUTO" | "A" | "B" | "EDITED" | "ADDED";
export type Truth = "A" | "B";

export function effectivePick(
    aRoot: any,
    bRoot: any,
    truth: Truth,
    pickByKey: Partial<Record<string, Pick>>,
    path: string
): "A" | "B" | "R" {
    const p = pickByKey[path] ?? "AUTO";
    if (p === "A") return "A";
    if (p === "B") return "B";
    if (p === "EDITED" || p === "ADDED") return "R";

    const a = getByPath(aRoot, path);
    const b = getByPath(bRoot, path);

    if (a !== undefined && b === undefined) return "A";
    if (b !== undefined && a === undefined) return "B";

    return truth;
}

export function isDiff(aRoot: any, bRoot: any, path: string) {
    const a = getByPath(aRoot, path);
    const b = getByPath(bRoot, path);
    if (a === undefined || b === undefined) return false;
    return String(a ?? "") !== String(b ?? "");
}
