import type { DiagnosticItem } from "../types";
import type { TemplateEngine, PreviewClient } from "../../preview/clientProfiles";

const VOID_TAGS = new Set(["img", "br", "hr", "meta", "link", "input", "area", "base", "col", "embed", "param", "source", "track", "wbr"]);

export const htmlEmailRule = {
    id: "html_email",
    check(input: { code: string; templateEngine: TemplateEngine; previewClient: PreviewClient }): DiagnosticItem[] {
        const text = input.code;
        const list: DiagnosticItem[] = [];

        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>/g;
        const stack: { name: string; offset: number }[] = [];

        let match: RegExpExecArray | null;

        while ((match = tagRegex.exec(text))) {
            const raw = match[0];
            const name = match[1].toLowerCase();
            const isClosing = raw.startsWith("</");
            const isSelfClosing = raw.endsWith("/>") || VOID_TAGS.has(name);

            if (isClosing) {
                const last = stack[stack.length - 1];
                if (!last || last.name !== name) {
                    list.push(make("error", `Unexpected closing tag </${name}>`, match.index, match.index + raw.length));
                    continue;
                }
                stack.pop();
                continue;
            }

            if (!isSelfClosing) stack.push({ name, offset: match.index });

            if (name === "img") {
                if (!/alt\s*=/.test(raw)) list.push(make("error", "Image tag must have alt attribute", match.index, match.index + raw.length));
                if (!/src\s*=/.test(raw)) list.push(make("error", "Image tag must have src attribute", match.index, match.index + raw.length));
            }

            if (name === "a") {
                if (!/href\s*=/.test(raw)) list.push(make("error", "Link tag must have href attribute", match.index, match.index + raw.length));
            }

            if (name === "table") {
                if (!/role\s*=\s*["']presentation["']/.test(raw)) {
                    list.push(make("warning", 'Email table should include role="presentation"', match.index, match.index + raw.length));
                }
                if (!/\bcellspacing\s*=/.test(raw)) {
                    list.push(make("warning", 'Email table should include cellspacing="0"', match.index, match.index + raw.length));
                }
                if (!/\bcellpadding\s*=/.test(raw)) {
                    list.push(make("warning", 'Email table should include cellpadding="0"', match.index, match.index + raw.length));
                }
                if (!/\bborder\s*=\s*["']?0["']?/.test(raw)) {
                    list.push(make("warning", 'Email table should include border="0"', match.index, match.index + raw.length));
                }
            }

            if (input.previewClient === "outlook" && name === "div") {
                list.push(make("error", "Outlook profile: avoid <div> in email layout. Prefer tables.", match.index, match.index + raw.length));
            }
        }

        for (const unclosed of stack.slice(-50)) {
            list.push(make("error", `Tag <${unclosed.name}> is not closed`, unclosed.offset, Math.min(text.length, unclosed.offset + 1)));
        }

        const headIdx = text.toLowerCase().indexOf("<head");
        if (headIdx !== -1) {
            if (!/meta\s+charset\s*=/.test(text.toLowerCase())) {
                list.push(make("warning", 'Missing <meta charset="...">', headIdx, headIdx + 5));
            }
            if (!/meta\s+name\s*=\s*["']viewport["']/.test(text.toLowerCase())) {
                list.push(make("warning", 'Missing <meta name="viewport" ...>', headIdx, headIdx + 5));
            }
        }

        const hasRootPresentationTable = /<table\b[^>]*role\s*=\s*["']presentation["'][^>]*width\s*=\s*["']?100%["']?/i.test(text);
        if (!hasRootPresentationTable) {
            list.push(make("warning", 'Missing root layout table: <table role="presentation" width="100%">', 0, Math.min(40, text.length)));
        }

        return list;
    },
};

function make(severity: "warning" | "error", message: string, startOffset: number, endOffset: number): DiagnosticItem {
    return {
        id: `${Math.random().toString(16).slice(2)}_${startOffset}`,
        ruleId: "html_email",
        severity,
        message,
        startOffset,
        endOffset,
    };
}
