import { getByPath } from "./json";
import type { Truth, Pick } from "./pick";
import { effectivePick, isDiff } from "./pick";

export type Pane = "A" | "B" | "R";
export type Highlight = "new" | "conflict" | "added" | "edited" | null;

export function highlightFor(args: {
    aRoot: any;
    bRoot: any;
    truth: Truth;
    pickByKey: Partial<Record<string, Pick>>;
    addedKeys: Set<string>;
    editedKeys: Set<string>;
    path: string;
    pane: Pane;
}): Highlight {
    const { aRoot, bRoot, truth, pickByKey, addedKeys, editedKeys, path, pane } = args;
    if (!path) return null;

    const hasA = getByPath(aRoot, path) !== undefined;
    const hasB = getByPath(bRoot, path) !== undefined;

    if (addedKeys.has(path) || pickByKey[path] === "ADDED") {
        return pane === "R" ? "added" : null;
    }

    if (editedKeys.has(path) || pickByKey[path] === "EDITED") {
        return pane === "R" ? "edited" : null;
    }

    const conflictPicked =
        isDiff(aRoot, bRoot, path) &&
        (pickByKey[path] === "A" || pickByKey[path] === "B" || pickByKey[path] === "EDITED");
    if (conflictPicked) return "conflict";

    const onlyA = hasA && !hasB;
    const onlyB = hasB && !hasA;
    const picked = effectivePick(aRoot, bRoot, truth, pickByKey, path);

    if (picked === "A" && onlyA) return pane === "B" ? null : "new";
    if (picked === "B" && onlyB) return pane === "A" ? null : "new";

    return null;
}
