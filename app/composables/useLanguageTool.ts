export async function checkTextWithLanguageTool(text, lang) {
    const params = new URLSearchParams({
        text,
        language: lang,
    });

    const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    if (!res.ok) {
        throw new Error("LanguageTool API error");
    }

    return await res.json();
}
