import { normalizeLoadedJson, safeParseJson, type JsonValue } from "./json";

export type DocType = "json" | "yaml" | "xml" | "csv";

export async function parseByType(type: DocType, text: string): Promise<{ ok: true; value: JsonValue } | { ok: false; error: string }> {
    try {
        if (type === "json") {
            const p = safeParseJson(text);
            if (!p.ok) return { ok: false, error: p.error };
            return { ok: true, value: normalizeLoadedJson(p.value) };
        }

        if (type === "yaml") {
            const { parse } = await import("yaml");
            return { ok: true, value: normalizeLoadedJson(parse(text)) };
        }

        if (type === "xml") {
            const { XMLParser } = await import("fast-xml-parser");
            const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
            return { ok: true, value: normalizeLoadedJson(parser.parse(text)) };
        }

        if (type === "csv") {
            const Papa = (await import("papaparse")).default;
            const res = Papa.parse(text, { header: true, skipEmptyLines: true });
            if (res.errors?.length) return { ok: false, error: res.errors[0].message };
            return { ok: true, value: normalizeLoadedJson(res.data as any) };
        }

        return { ok: false, error: "Unsupported" };
    } catch (e: any) {
        return { ok: false, error: e?.message || "Parse error" };
    }
}

export async function stringifyAs(type: DocType, obj: any, jsonStringify: (v: any) => string): Promise<string> {
    if (type === "json") return jsonStringify(obj);

    if (type === "yaml") {
        const { stringify } = await import("yaml");
        return stringify(obj);
    }

    if (type === "xml") {
        const { XMLBuilder } = await import("fast-xml-parser");
        const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        return builder.build(obj);
    }

    if (type === "csv") {
        const Papa = (await import("papaparse")).default;
        const arr = Array.isArray(obj) ? obj : [];
        return Papa.unparse(arr);
    }

    return jsonStringify(obj);
}
