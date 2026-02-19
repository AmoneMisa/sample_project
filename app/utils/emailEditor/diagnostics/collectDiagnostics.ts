import type { DiagnosticItem } from "./types";
import type { TemplateEngine, PreviewClient } from "../preview/clientProfiles";

import { htmlEmailRule } from "./rules/htmlEmailRule";
import { cssDuplicateClassRule } from "./rules/cssDuplicateClassRule";
import { templateSyntaxRule } from "./rules/templateSyntaxRule";
import { imageFormatRule } from "./rules/imageFormatRule";

export function collectDiagnostics(input: { code: string; templateEngine: TemplateEngine; previewClient: PreviewClient }): DiagnosticItem[] {
    const rules = [
        htmlEmailRule,
        cssDuplicateClassRule,
        templateSyntaxRule,
        imageFormatRule,
    ];

    const list = rules.flatMap((r) => r.check(input)).map((d) => ({
        ...d,
        approxLine: approximateLine(input.code, d.startOffset),
    }));

    list.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
        return a.startOffset - b.startOffset;
    });

    return list;
}

function approximateLine(text: string, offset: number) {
    return text.slice(0, Math.max(0, offset)).split("\n").length;
}
