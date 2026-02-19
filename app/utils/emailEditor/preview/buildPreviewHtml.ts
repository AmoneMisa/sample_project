import type { PreviewClient, TemplateEngine } from "./clientProfiles";

export function buildPreviewHtml(input: {
    code: string;
    templateEngine: TemplateEngine;
    previewClient: PreviewClient;
}) {
    const safe = sanitizeEmailHtml(String(input.code ?? ""));

    const baseReset = previewBaseResetForClient(input.previewClient);

    return [
        "<!doctype html>",
        "<html>",
        "<head>",
        '  <meta charset="utf-8" />',
        '  <meta name="viewport" content="width=device-width,initial-scale=1" />',
        `  <style>${baseReset}</style>`,
        "</head>",
        "<body>",
        safe,
        "</body>",
        "</html>",
    ].join("\n");
}

function previewBaseResetForClient(client: PreviewClient) {
    const common = `
html, body { margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; padding: 16px; color: #15162A; }
table { border-collapse: collapse; }
img { max-width: 100%; height: auto; }
  `.trim();

    if (client === "gmail") {
        return common + `
.email-preview-wrap { max-width: 660px; margin: 0 auto; }
    `.trim();
    }

    if (client === "yandex") {
        return common.trim();
    }

    return common + `
a { text-decoration: underline; }
    `.trim();
}

function sanitizeEmailHtml(html: string) {
    let s = html;

    s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    s = s.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "");
    s = s.replace(/\shref\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, ' href="#"');
    s = s.replace(/\ssrc\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, ' src=""');

    return s;
}
