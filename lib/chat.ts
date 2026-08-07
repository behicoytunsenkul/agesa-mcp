import { query } from "./db";
import type { ChatMessage, ChatSession } from "./types";

export async function ensureSession(sessionId: string, title?: string) {
  const existing = await query<ChatSession>(
    `SELECT id, title, created_at, updated_at FROM public.chat_sessions WHERE id = $1`,
    [sessionId]
  );
  if (existing.rows[0]) return existing.rows[0];

  const res = await query<ChatSession>(
    `INSERT INTO public.chat_sessions (id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at, updated_at`,
    [sessionId, title?.slice(0, 120) || "Yeni sohbet"]
  );
  return res.rows[0];
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  await ensureSession(sessionId, role === "user" ? content : undefined);

  if (role === "user") {
    await query(
      `UPDATE public.chat_sessions
       SET updated_at = NOW(),
           title = CASE
             WHEN title = 'Yeni sohbet' THEN LEFT($2, 120)
             ELSE title
           END
       WHERE id = $1`,
      [sessionId, content]
    );
  } else {
    await query(
      `UPDATE public.chat_sessions SET updated_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  }

  const res = await query<ChatMessage>(
    `INSERT INTO public.chat_messages (session_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING id, session_id, role, content, created_at`,
    [sessionId, role, content]
  );
  return res.rows[0];
}

export async function listSessions() {
  const res = await query<ChatSession & { message_count: string }>(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
            COUNT(m.id)::text AS message_count
     FROM public.chat_sessions s
     LEFT JOIN public.chat_messages m ON m.session_id = s.id
     GROUP BY s.id
     ORDER BY s.updated_at DESC
     LIMIT 200`
  );
  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    created_at: r.created_at,
    updated_at: r.updated_at,
    message_count: parseInt(r.message_count, 10),
  }));
}

export async function getSessionMessages(sessionId: string) {
  const session = await query<ChatSession>(
    `SELECT id, title, created_at, updated_at FROM public.chat_sessions WHERE id = $1`,
    [sessionId]
  );
  if (!session.rows[0]) return null;

  const messages = await query<ChatMessage>(
    `SELECT id, session_id, role, content, created_at
     FROM public.chat_messages
     WHERE session_id = $1
     ORDER BY created_at ASC, id ASC`,
    [sessionId]
  );

  return { session: session.rows[0], messages: messages.rows };
}

export async function deleteSession(sessionId: string) {
  const res = await query(
    `DELETE FROM public.chat_sessions WHERE id = $1 RETURNING id`,
    [sessionId]
  );
  return (res.rowCount ?? 0) > 0;
}
