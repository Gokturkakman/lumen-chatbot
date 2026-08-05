# Lumen — Mimari Plan

Çok modelli, araç kullanan bir sohbet asistanı. Next.js 16 (App Router) +
Vercel AI SDK 7 üzerine kurulu; Gemini ve Groq'tan 8 model, Postgres'te kalıcı
geçmiş, beş canlı araç.

**Canlı:** https://lumen-chatbot-pi.vercel.app
**Repo:** https://github.com/Gokturkakman/lumen-chatbot

---

## 1. Genel akış

```
Tarayıcı (useChat)
      │  POST /api/chat  { id, message, modelId, locale }
      ▼
app/api/chat/route.ts
      │
      ├─ Oturumu doğrula / misafir oluştur ─────────► lib/auth/session.ts
      ├─ Sohbeti yükle veya oluştur ─────────────────► lib/db/queries.ts (Postgres)
      ├─ Kullanıcı mesajını kaydet
      ├─ streamText({ model, tools, messages })
      │       │
      │       ├─ Gemini / Groq'a istek ────────────────► lib/ai/providers.ts
      │       ├─ Gerekirse araç çağırır ───────────────► lib/ai/tools/*
      │       └─ smoothStream ile karakter karakter yayınlar
      │
      ├─ Yanıtı kaydet, sohbeti "touch" et
      └─ Yeni sohbetse başlığı otomatik üret (ucuz modelle)
      ▼
Tarayıcı: UI mesaj akışını render eder, araç sonuçları için özel kart gösterir
```

Tek route (`app/api/chat/route.ts`), tek stream. Kalıcılık, araç çağrısı ve
başlıklama aynı isteğin içinde, ayrı bir arka plan işi yok.

---

## 2. Katmanlar

### `app/` — rotalar
- `api/chat/route.ts` — asıl motor: doğrulama, kalıcılık, streaming, hata mesajlarını sağlayıcıdan çözme.
- `api/chats/`, `api/chats/[id]/` — sohbet listesi, yeniden adlandırma, silme.
- `api/auth/` — misafir → hesap yükseltme, giriş, çıkış (bcrypt + imzalı çerez).
- `page.tsx`, `c/[id]/page.tsx` — sunucu tarafında geçmişi önceden yükler.

### `lib/ai/` — model ve araç katmanı
- `models.ts` — katalog. Anahtarı olmayan sağlayıcının modelleri arayüzde hiç görünmez.
- `providers.ts` — katalog id'sini gerçek SDK çağrısına çeviren tek nokta.
- `prompts.ts` — dile duyarlı sistem promptu.
- `tools/` — beş bağımsız araç, her biri kendi `execute` fonksiyonuyla:
  - `get-news.ts` — RSS → Google News → Exa, üç kademeli.
  - `summarize-youtube.ts` — Gemini'ye video dosyası olarak verilir, yapılandırılmış obje döner.
  - `get-linkedin-profile.ts` — Jina okuyucu → Exa arama.
  - `web-search.ts` — Exa varsa Exa, yoksa DuckDuckGo (anahtarsız).
  - `read-url.ts` — herhangi bir sayfayı Jina üzerinden temiz metne çevirir.

### `lib/db/` — kalıcılık
Drizzle ORM + Postgres (Neon). Üç tablo: `User`, `Chat`, `Message`.
`Message.parts` ham UIMessage parçalarını JSON olarak tutar, bu yüzden araç
çağrıları ve dosya ekleri de tam olarak geri yüklenir.

### `lib/auth/` — oturum
Çerezde imzalı JWT (jose). İlk ziyarette otomatik misafir kaydı; kayıt olma,
mevcut misafir satırını hesaba yükseltir, sohbetler kaybolmaz.

### `components/` — arayüz
- `app-shell.tsx` — `useChat` hook'unu, kenar çubuğunu ve oluşturucuyu birbirine bağlayan üst bileşen.
- `tools/*-card.tsx` — her aracın kendi görsel sonucu (haber dizini, video zaman çizelgesi, LinkedIn kartı, arama sonuçları). Model bunları düz metin olarak tekrar yazmıyor, sadece üstüne bir-iki cümle sentez ekliyor.

---

## 3. Kritik tasarım kararları

**Neden üç kademeli haber aracı?**
Arama API'leri haber sıralamasında güvenilir değil ve kota tüketiyor. Önce
yayın kuruluşunun kendi RSS akışı denenir (43 kaynak elle kayıtlı + otomatik
keşif), bulunamazsa Google News'e, o da olmazsa Exa'ya düşülür. Sonuç hem
ücretsiz hem kaynağın kendi editoryal sıralaması.

**Neden `stopWhen: stepCountIs(6)`?**
Model araçları zincirleyebilsin diye: önce arar, en iyi sonucu tam okur,
sonra cevabı yazar — tek bir tur değil, çok adımlı bir araştırma.

**Model kataloğu neden canlı doğrulanıyor?**
Sağlayıcılar model kaldırmayı duyurmadan yapıyor (Google tüm Gemini 2.5
serisini yeni anahtarlara kapattı, Groq Llama 4 Scout'u kaldırdı).
`scripts/check-models.mts` kataloğun her girdisini gerçek bir araç çağrısıyla
sınar; `scripts/check-feeds.mts` aynısını 43 haber beslemesi için yapar.

**Hata mesajları neden bu kadar ayrıntılı?**
AI SDK, sağlayıcı hatasını birkaç katman derinlikte sarmalıyor — üst katman
sadece "An error occurred." diyor. `findApiError()` bu zinciri gezip gerçek
mesajı çıkarıyor; Gemini'nin günlük 20 istek kotası dolduğunda kullanıcıya
model adı, bekleme süresi ve "başka modele geç" önerisiyle net bir mesaj
gösteriliyor.

**Yeni bir model/sağlayıcı eklemek**
`lib/ai/models.ts`'e kayıt ekle, `lib/ai/providers.ts`'teki `switch`'e bir
`case` ekle. Başka hiçbir yer değişmez.

---

## 4. Veri modeli

```
User      id, email (nullable+unique), password, isGuest, createdAt
Chat      id, userId → User, title, createdAt, updatedAt
Message   id (varchar, AI SDK'nın ürettiği kısa id), chatId → Chat,
          role, parts (json), modelId, createdAt
```

`Message.id` bilerek `uuid` değil: AI SDK istemci tarafında kısa opak id'ler
üretiyor (`Ko5yjldZrUtXDKWd` gibi), aynı id round-trip'te korunmalı ki bir
sohbete devam ederken mesaj çiftlenmesin.

---

## 5. Dağıtım

- **Veritabanı:** Neon Postgres (Frankfurt bölgesi, Türkiye'ye yakın).
- **Model sağlayıcıları:** Google AI Studio (Gemini), Groq — ikisi de ücretsiz katman, kart gerekmez.
- **Hosting:** Vercel, CLI ile deploy edildi (`vercel deploy --prod`), ortam değişkenleri şifreli olarak Vercel'de.
- **Sağlık kontrolü:** `npm run check:models && npm run check:feeds` — deploy öncesi çalıştırılması önerilir.
