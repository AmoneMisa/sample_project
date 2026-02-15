import { getByPath } from "./json";
import type { Truth } from "./pick";
import { isDiff } from "./pick";

export type Pane = "A" | "B" | "R";
export type Pick = "AUTO" | "A" | "B" | "EDITED" | "ADDED";

export type DecoKind = "new" | "conflict" | "added" | "edited" | "find";
export type Deco = { path: string; kind: DecoKind };

export function buildDecorations(args: {
    pane: Pane;
    keys: string[];
    query: string;
    match: (pane: Pane, path: string) => boolean;
    jsonA: any;
    jsonB: any;
    truth: Truth;
    pickByKey: Partial<Record<string, Pick>>;
    addedKeys: Set<string>;
    editedKeys: Set<string>;
}): Deco[] {
    const { pane, keys, query, match, jsonA, jsonB, truth, pickByKey, addedKeys, editedKeys } = args;

    const out: Deco[] = [];
    const q = query.trim();
    const matchKey = q ? keys.find((k) => match("R", k)) : null;

    for (const k of keys) {
        if (matchKey && k === matchKey) out.push({ path: k, kind: "find" });

        if (addedKeys.has(k) || pickByKey[k] === "ADDED") {
            if (pane === "R") out.push({ path: k, kind: "added" });
            continue;
        }

        if (editedKeys.has(k) || pickByKey[k] === "EDITED") {
            if (pane === "R") out.push({ path: k, kind: "edited" });
            continue;
        }

        const hasA = getByPath(jsonA, k) !== undefined;
        const hasB = getByPath(jsonB, k) !== undefined;

        const conflictPicked =
            isDiff(jsonA, jsonB, k) &&
            (pickByKey[k] === "A" || pickByKey[k] === "B" || pickByKey[k] === "EDITED");

        if (conflictPicked) {
            out.push({ path: k, kind: "conflict" });
            continue;
        }

        const onlyA = hasA && !hasB;
        const onlyB = hasB && !hasA;

        const picked = pickByKey[k] === "A" ? "A" : pickByKey[k] === "B" ? "B" : truth;

        if (picked === "A" && onlyA) {
            if (pane !== "B") out.push({ path: k, kind: "new" });
        }
        if (picked === "B" && onlyB) {
            if (pane !== "A") out.push({ path: k, kind: "new" });
        }
    }

    return out;
}
