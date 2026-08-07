-- Agesa Firma Asistanı — Neon / PostgreSQL schema

CREATE TABLE IF NOT EXISTS public.firmalar (
  id SERIAL PRIMARY KEY,
  sira INTEGER,
  firma_adi TEXT NOT NULL,
  firma_aciklamasi TEXT,
  urun_gami TEXT,
  iletildigi_kanal TEXT,
  ana_kategori TEXT,
  alt_kategori TEXT,
  degerlendirme TEXT,
  referans TEXT,
  rakipler TEXT,
  ekip TEXT,
  not_metni TEXT,
  link TEXT,
  yol_haritasi_giris_tarihi TEXT,
  gorusme_tarihi TEXT,
  katilimcilar TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT firmalar_firma_adi_unique UNIQUE (firma_adi)
);

CREATE INDEX IF NOT EXISTS idx_firmalar_ana_kategori ON public.firmalar (ana_kategori);
CREATE INDEX IF NOT EXISTS idx_firmalar_alt_kategori ON public.firmalar (alt_kategori);
CREATE INDEX IF NOT EXISTS idx_firmalar_degerlendirme ON public.firmalar (degerlendirme);
CREATE INDEX IF NOT EXISTS idx_firmalar_kanal ON public.firmalar (iletildigi_kanal);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Yeni sohbet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions (updated_at DESC);
