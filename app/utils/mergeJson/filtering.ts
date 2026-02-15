import type { Pane } from "./highlight";
import type { JsonValue } from "./json";

export function hiddenKeysForPane(args: {
    pane: Pane;
    keys: string[];
    onlyDiff: boolean;
    diffSet: Set<string>;
    query: string;
    match: (pane: Pane, path: string) => boolean;
}) {
    const { pane, keys, onlyDiff, diffSet, query, match } = args;

    return keys.filter((k) => {
        if (onlyDiff && !diffSet.has(k)) return true;
        return !!(query.trim() && !match(pane, k));
    });
}
