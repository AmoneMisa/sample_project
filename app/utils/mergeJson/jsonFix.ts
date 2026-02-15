import {safeParseJson} from "./json";

export function normalizeQuotes(s: string) {
    return s
        .replace(/[“”„‟]/g, '"')
        .replace(/[‘’‚‛]/g, "'")
        .replace(/\u00A0/g, " ");
}

export function fixSingleQuotesLikelyJson(s: string) {
    s = s.replace(
        /'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g,
        (_, inner) => `"${inner.replace(/"/g, '\\"')}" :`.replace(" :", ":")
    );
    s = s.replace(
        /:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g,
        (_, inner) => `: "${inner.replace(/"/g, '\\"')}"`
    );
    return s;
}

export function fixJsonText(raw: string) {
    let s = normalizeQuotes(raw);
    const p1 = safeParseJson(s.trim() || "{}");
    if (p1.ok) return {ok: true as const, text: s, value: p1.value};

    s = fixSingleQuotesLikelyJson(s);
    const p2 = safeParseJson(s.trim() || "{}");
    if (p2.ok) return {ok: true as const, text: s, value: p2.value};

    return {ok: false as const, error: p2.ok ? "" : p2.error};
}
