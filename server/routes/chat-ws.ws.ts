import WebSocket from "ws";

const upstreamMap = new Map<string, WebSocket>();

function getClientId(url: string) {
    try {
        const u = new URL(url, "http://local");
        return (u.searchParams.get("clientId") || "").trim();
    } catch {
        return "";
    }
}

function makeUpstreamUrl(peerUrl: string) {
    const config = useRuntimeConfig();
    const backendHttp = String(config.apiBase || "http://backend:8000").replace(/\/$/, "");
    const backendWs = backendHttp.replace(/^http/i, (m) => (m.toLowerCase() === "https" ? "wss" : "ws"));

    const clientId = getClientId(peerUrl);
    return `${backendWs}/chat/ws?clientId=${encodeURIComponent(clientId)}`;
}

export default defineWebSocketHandler({
    open(peer) {
        const peerId = String(peer.id);
        const upstreamUrl = makeUpstreamUrl(peer.request.url || "");

        const upstream = new WebSocket(upstreamUrl);
        upstreamMap.set(peerId, upstream);

        upstream.on("message", (data) => {
            peer.send(data.toString());
        });

        upstream.on("close", () => {
            try { peer.close(); } catch {}
        });

        upstream.on("error", () => {
            try { peer.close(); } catch {}
        });
    },

    message(peer, message) {
        const upstream = upstreamMap.get(String(peer.id));
        if (!upstream) return;

        if (upstream.readyState === WebSocket.OPEN) {
            upstream.send(String(message));
        }
    },

    close(peer) {
        const key = String(peer.id);
        const upstream = upstreamMap.get(key);
        upstreamMap.delete(key);
        try { upstream?.close(); } catch {}
    },
});