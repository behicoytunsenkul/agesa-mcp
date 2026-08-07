import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/chat";
import { sendChatMessage } from "@/lib/n8n";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body?.sessionId?.toString().trim();
    const message = body?.message?.toString().trim();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "sessionId ve message zorunludur." },
        { status: 400 }
      );
    }

    await addMessage(sessionId, "user", message);

    let reply: string;
    try {
      reply = await sendChatMessage(sessionId, message);
    } catch (err) {
      const fail =
        err instanceof Error
          ? err.message
          : "n8n asistanına ulaşılamadı.";
      await addMessage(
        sessionId,
        "assistant",
        `Üzgünüm, asistan şu an yanıt veremedi: ${fail}`
      );
      return NextResponse.json(
        { error: fail, sessionId },
        { status: 502 }
      );
    }

    const assistantMsg = await addMessage(sessionId, "assistant", reply);

    return NextResponse.json({
      sessionId,
      reply,
      message: assistantMsg,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
