import { getByPath } from "./json";
import type { Truth, Pick } from "./pick";
import { effectivePick, isDiff } from "./pick";

export type Pane = "A" | "B" | "R";
export type Highlight = "new" | "conflict" | "added" | "edited" | null;

