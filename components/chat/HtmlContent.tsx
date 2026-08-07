"use client";

import DOMPurify from "isomorphic-dompurify";

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export function HtmlContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  if (!looksLikeHtml(content)) {
    return (
      <div className={`whitespace-pre-wrap ${className}`}>{content}</div>
    );
  }

  const safe = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });

  return (
    <div
      className={`chat-html ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
