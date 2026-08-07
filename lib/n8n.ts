const DEFAULT_URL =
  "https://ictworks.app.n8n.cloud/webhook/firma-asistani-chat-webhook/chat";

export async function sendChatMessage(sessionId: string, message: string) {
  const url = process.env.N8N_CHAT_URL || DEFAULT_URL;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "sendMessage",
      sessionId,
      chatInput: message,
    }),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { output: text };
  }

  if (!res.ok) {
    throw new Error(
      `n8n chat hatası (${res.status}): ${typeof data === "string" ? data : text.slice(0, 300)}`
    );
  }

  return extractReply(data);
}

function extractReply(data: unknown): string {
  if (data == null) return "Yanıt alınamadı.";
  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first === "object") {
      return extractReply(first);
    }
    return JSON.stringify(data);
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.output === "string") return obj.output;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.message === "string") return obj.message;
    if (obj.json && typeof obj.json === "object") {
      return extractReply(obj.json);
    }
    if (typeof obj.data === "string") return obj.data;
    return JSON.stringify(obj, null, 2);
  }

  return String(data);
}
