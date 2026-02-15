import { getByPath } from "./json";
import type { Pane } from "./highlight";

export function matchesInPane(args: {
    aRoot: any;
    bRoot: any;
    rRoot: any;
    pane: Pane;
    path: string;
    query: string;
}) {
    const { aRoot, bRoot, rRoot, pane, path, query } = args;

    const q = query.trim().toLowerCase();
    if (!q) return false;

    if (path.toLowerCase().includes(q)) return true;

    const val =
        pane === "A" ? getByPath(aRoot, path)
            : pane === "B" ? getByPath(bRoot, path)
                : getByPath(rRoot, path);

    return String(val ?? "").toLowerCase().includes(q);
}
