import WebSocket from "ws";

function getClientId(url: string) {
    try {
        const u = new URL(url, "http://local");
        return (u.searchParams.get("clientId") || "").trim();
    } catch {
        return "";
    }
}

export default defineWebSocketHandler({
    open(peer) {
        const config = useRuntimeConfig();
        const backendHttp = String(config.apiBase || "http://backend:8000").replace(/\/$/, "");
        const backendWs = backendHttp.replace(/^http/i, (m) => (m.toLowerCase() === "https" ? "wss" : "ws"));

        const clientId = getClientId(peer.request.url || "");
        const upstreamUrl = `${backendWs}/chat/ws?clientId=${encodeURIComponent(clientId)}`;

        const upstream = new WebSocket(upstreamUrl);

        upstream.on("message", (data) => {
            peer.send(data.toString());
        });

        upstream.on("close", () => {
            try { peer.close(); } catch {}
        });

        upstream.on("error", () => {
            try { peer.close(); } catch {}
        });

        peer.on("message", (event) => {
            if (upstream.readyState === WebSocket.OPEN) {
                upstream.send(typeof event.data === "string" ? event.data : String(event.data));
            }
        });

        peer.on("close", () => {
            try { upstream.close(); } catch {}
        });
    },
});