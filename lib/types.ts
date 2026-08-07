export type Firma = {
  id: number;
  sira: number | null;
  firma_adi: string;
  firma_aciklamasi: string | null;
  urun_gami: string | null;
  iletildigi_kanal: string | null;
  ana_kategori: string | null;
  alt_kategori: string | null;
  degerlendirme: string | null;
  referans: string | null;
  rakipler: string | null;
  ekip: string | null;
  not_metni: string | null;
  link: string | null;
  yol_haritasi_giris_tarihi: string | null;
  gorusme_tarihi: string | null;
  katilimcilar: string | null;
  updated_at: string;
};

export type FirmaInput = Omit<Firma, "id" | "updated_at"> & {
  id?: number;
  updated_at?: string;
};

export type DistributionItem = {
  deger: string;
  adet: number;
  yuzde: number;
};

export type CompletenessItem = {
  alan: string;
  adet: number;
  yuzde: number;
};

export type PipelineTagItem = {
  etiket: string;
  adet: number;
  yuzde: number;
};

export type CrossCell = {
  kategori: string;
  etiket: string;
  adet: number;
};

export type DashboardStats = {
  toplam_firma: number;
  kategori_sayisi: number;
  degerlendirme_sayisi: number;
  kanal_sayisi: number;
  aktif_pipeline: number;
  kapandi: number;
  degerlendirme_eksik: number;
  ana_kategori_dagilimi: DistributionItem[];
  alt_kategori_dagilimi: DistributionItem[];
  degerlendirme_dagilimi: DistributionItem[];
  kanal_dagilimi: DistributionItem[];
  pipeline_etiketleri: PipelineTagItem[];
  veri_doluluk: CompletenessItem[];
  kategori_x_pipeline: CrossCell[];
  top_referanslar: DistributionItem[];
  chat_ozet: {
    session_sayisi: number;
    mesaj_sayisi: number;
    son_7_gun_session: number;
  };
  son_guncellenenler: Pick<
    Firma,
    "id" | "firma_adi" | "ana_kategori" | "degerlendirme" | "updated_at"
  >[];
};

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
};

export type ChatMessage = {
  id: number;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type FirmaFilters = {
  q?: string;
  ana_kategori?: string;
  iletildigi_kanal?: string;
  degerlendirme?: string;
  /** kapandi | aktif | eksik */
  kapanma_durumu?: string;
  /** updated_at | gorusme_tarihi | yol_haritasi_giris_tarihi */
  tarih_alani?: string;
  /** tek | aralik */
  tarih_mod?: string;
  tarih?: string;
  tarih_baslangic?: string;
  tarih_bitis?: string;
  limit?: number;
  offset?: number;
};
