# Lumen

Araştıran bir sohbet asistanı. Haberleri kaynağından çeker, YouTube videolarını
gerçekten izler, web'i okur, görselleri anlar — sekiz farklı model arasında
geçiş yaparak.

> An assistant that looks things up: pulls headlines from the source, actually
> watches YouTube videos, reads the web, understands images — across eight
> models from two providers.

---

## Görev şartları / Requirements coverage

| Şart | Durum | Nerede |
| --- | --- | --- |
| Bir yayın kuruluşunun son 5 haberi | ✅ | [`lib/ai/tools/get-news.ts`](lib/ai/tools/get-news.ts) — resmi RSS → Google News → Exa, üç kademeli |
| Resim girdisi | ✅ | [`components/composer.tsx`](components/composer.tsx) — sürükle-bırak, yapıştır, dosya seç; tarayıcıda 1568px'e küçültülür |
| Birden fazla model | ✅ | 8 model / 2 sağlayıcı — [`lib/ai/models.ts`](lib/ai/models.ts) |
| Eski mesajlaşmalar | ✅ | Postgres + Drizzle, kenar çubuğunda tarihe göre gruplanmış |
| Karakter karakter stream | ✅ | `smoothStream({ chunking: /[\s\S]/ })` — [`app/api/chat/route.ts`](app/api/chat/route.ts) |
| **Bonus:** LinkedIn profili okuma | ✅ | [`lib/ai/tools/get-linkedin-profile.ts`](lib/ai/tools/get-linkedin-profile.ts) |
| **Bonus:** YouTube videosu özetleme | ✅ | [`lib/ai/tools/summarize-youtube.ts`](lib/ai/tools/summarize-youtube.ts) — Gemini videoyu doğrudan izler |

---

## Kurulum

### 1. Anahtarları al (hepsi ücretsiz, kart gerekmez)

| Servis | Link | Ne için |
| --- | --- | --- |
| Google AI Studio | https://aistudio.google.com/apikey | Gemini modelleri + YouTube video izleme |
| Groq | https://console.groq.com/keys | Llama / Kimi / GPT-OSS modelleri |
| Neon | https://neon.tech | Postgres veritabanı |

Opsiyonel: [Exa](https://exa.ai) (isimle LinkedIn araması, daha iyi web araması),
[Jina](https://jina.ai) (LinkedIn okumada daha yüksek hız limiti).

### 2. `.env.local` dosyasını doldur

```bash
cp .env.example .env.local
```

`AUTH_SECRET` üretmek için:

```bash
openssl rand -base64 32
```

### 3. Kur ve çalıştır

```bash
npm install && npm run db:push && npm run dev
```

`http://localhost:3000` — giriş yapmana gerek yok, misafir olarak hemen başlar.

---

## Vercel'e deploy

1. Projeyi GitHub'a push et.
2. [vercel.com/new](https://vercel.com/new) → repoyu içe aktar.
3. `.env.local` içindeki tüm değişkenleri **Environment Variables** bölümüne yapıştır.
4. Deploy. (Şema `db:push` ile zaten kurulduğu için ek adım yok.)

---

## Mimari

```
app/
  api/chat/route.ts        streaming sohbet — araçlar, kalıcılık, otomatik başlık
  api/chats/               sohbet listesi, yeniden adlandırma, silme
  api/auth/                misafir → hesap yükseltme, giriş, çıkış
  c/[id]/page.tsx          kayıtlı bir sohbeti sunucudan yükler

lib/
  ai/models.ts             model kataloğu — anahtarı olmayan sağlayıcı gizlenir
  ai/providers.ts          katalog id'si → sağlayıcı SDK'sı (tek geçiş noktası)
  ai/prompts.ts            sistem promptu (dile duyarlı)
  ai/tools/                getNews · webSearch · readUrl · summarizeYouTube · getLinkedInProfile
  auth/session.ts          jose ile imzalı çerez, ilk ziyarette misafir kaydı
  db/                      Drizzle şeması + sorgular
  i18n.tsx                 TR/EN sözlük ve context

components/
  app-shell.tsx            useChat + kenar çubuğu + oluşturucu düzeni
  tools/                   her aracın kendi sonuç kartı (bento)
```

### Araç zinciri

Model `stopWhen: stepCountIs(6)` ile çalışır, yani araçları zincirleyebilir —
önce arar, sonra en iyi sonucu tam metin okur, sonra cevabı yazar.

### Haber aracı neden üç kademeli?

Arama API'leri haber sıralamasında güvenilir değil ve kota yakıyor. Lumen önce
yayın kuruluşunun **kendi RSS akışını** bulmaya çalışır (60+ kuruluş için
kayıtlı, geri kalanı için ana sayfadan otomatik keşif + yaygın yolların
denenmesi). Bu hem ücretsiz hem de kaynağın kendi sıralaması. Bulamazsa Google
News'e, o da olmazsa Exa'ya düşer.

### Yeni bir sağlayıcı eklemek

`lib/ai/models.ts` içine model kaydını ekle, `lib/ai/providers.ts` içindeki
`switch`'e bir `case` ekle. Başka hiçbir yeri değiştirmen gerekmez — anahtarı
olmayan sağlayıcının modelleri arayüzde hiç görünmez.

---

## Tasarım notu

Koyu zemin + mor/mavi gradient + glow, yapay zekâ ürünlerinin varsayılanı
haline geldi. Lumen bilerek başka bir yerden başlıyor: sıcak kâğıt zemini,
serif başlıklar (Instrument Serif), saç teli inceliğinde çizgiler ve tek bir
kiremit rengi vurgu. Koyu tema de saf siyah değil, sıcak bir gece tonu.

Araç sonuçları düz metin olarak değil, içeriğin şekline göre render edilir:
haberler manşet + numaralı dizin, video bölümleri tıklanabilir zaman
çizelgesi, LinkedIn profil kartı.

## Lisans

MIT
