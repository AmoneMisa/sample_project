import { getByPath } from "./json";
import type { Truth } from "./pick";
import { isDiff } from "./pick";

export type Pane = "A" | "B" | "R";
export type Pick = "AUTO" | "A" | "B" | "EDITED" | "ADDED";

export type DecoKind = "new" | "conflict" | "added" | "edited" | "find";
export type Deco = { path: string; kind: DecoKind };

