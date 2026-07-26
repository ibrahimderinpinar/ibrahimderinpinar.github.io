# Derinpınar Hukuk Makale Şablonu Standardı

## 1) Resmî Master Şablon

Bu projede resmî ve tek makale şablonu aşağıdaki dosyadır:

- `anonim-sirketlerde-genel-kurul-suresinde-yapilmazsa-ne-olur.html`

Bu dosya, makale sayfaları için **master article template** olarak kabul edilmiştir.

---

## 2) Temel Kural

Bundan sonra oluşturulacak veya güncellenecek tüm makaleler:

- master şablonun HTML iskeletini,
- CSS sınıf yapısını,
- tipografisini,
- spacing ve kart düzenini,
- TOC (İçindekiler) tasarımını,
- bilgi kutularını,
- FAQ ve CTA bileşenlerini,
- responsive davranışını

**birebir** esas almalıdır.

Yeni veya alternatif bir makale tasarımı oluşturulamaz.

---

## 3) Dönüşüm / Üretim Prensibi

Yeni bir makale hazırlanırken yöntem:

1. Master dosya birebir kopyalanır.
2. Sadece içerik ve makaleye özgü alanlar değiştirilir.
3. Sunum katmanı (presentation layer) korunur.

---

## 4) Değiştirilebilir Alanlar (İzinli)

Aşağıdaki alanlar makaleye göre güncellenebilir:

- `<title>`
- `meta description`
- `canonical`
- Open Graph / Twitter meta alanları
- JSON-LD içerikleri (`headline`, `description`, `datePublished`, `dateModified`, `identifier`, `FAQ` vb.)
- Breadcrumb son elemanı
- Kategori etiketi
- H1 başlık
- Lead/Excerpt metni
- Makale gövde metni
- İlgili makaleler linkleri
- Makale kimliği (`articleId`) ve buna bağlı görüntülenme anahtarı

---

## 5) Değiştirilemez Alanlar (Zorunlu Koruma)

Aşağıdakiler master ile aynı kalmalıdır:

- HTML şablon akışı ve bölüm sırası
- CSS sınıf isimleri ve bileşen mimarisi
- Tipografi sistemi (`font-family`, `font-size`, `line-height`, başlık/p paragraf spacing)
- TOC görünümü ve davranışı
- Bilgi kutuları (Kanuni Dayanak / Önemli / Uygulamada / İpucu) stil dili
- CTA tasarımı
- FAQ tasarımı
- Kart yapıları, içerik genişliği, satır uzunluğu
- Responsive breakpoint ve mobil davranış
- Hover ve etkileşim stilleri

---

## 6) Zorunlu Sayfa Akışı

Her makale aşağıdaki sırayı takip etmelidir:

1. Breadcrumb  
2. Kategori etiketi  
3. Makale başlığı (H1)  
4. Kısa açıklama (Lead/Excerpt)  
5. Meta bilgi satırı:
   - Yayın tarihi
   - Son güncelleme tarihi
   - Okuma süresi
   - 👁 Görüntülenme sayısı
6. Hero görsel alanı (varsa)  
7. İçindekiler kutusu (TOC)  
8. Makale içeriği  
9. Bilgi kutuları (içeriğe uygun olanlar)  
10. Tablo/liste bileşenleri (gerektiğinde)  
11. Sık Sorulan Sorular (FAQ)  
12. Sonuç  
13. Hukuki Danışmanlık CTA  
14. İlgili Makaleler  

---

## 7) Görüntülenme (Views) Standardı

Master şablondaki görüntülenme yapısı zorunludur:

- Meta/chip düzeniyle görsel uyumlu olmalı
- Aynı satır sistemi içinde yer almalı
- Responsive düzeni bozmamalı
- Mevcut istemci tarafı sayaç yaklaşımı (localStorage tabanlı) korunmalı
- Her makale için benzersiz `articleId` / key kullanılmalı

---

## 8) SEO ve Structured Data Kuralı

Şablon dönüşümlerinde:

- URL/path değiştirilemez
- SEO alanları korunur/güncellenir
- Structured Data (JSON-LD) korunur ve makale içeriğiyle tutarlı güncellenir
- İçerik metni anlamı değiştirilmez

---

## 9) Yasaklar

- Farklı HTML makale şablonu kullanmak
- Yeni tipografi sistemi üretmek
- TOC tasarımını değiştirmek
- Bilgi kutularını farklı bir stile çevirmek
- Eski/alternatif makale tasarımına geri dönmek

---

## 10) Uygulama Notu (Copilot / Agent)

Copilot veya coding agent ile çalışırken aşağıdaki direktif kullanılmalıdır:

> “Bu makaleyi `anonim-sirketlerde-genel-kurul-suresinde-yapilmazsa-ne-olur.html` master şablonuna birebir uyarla; yalnızca içerik, SEO ve JSON-LD alanlarını makaleye göre güncelle; sunum katmanını değiştirme.”

---

## 11) Nihai Hedef

Projede yer alan tüm hukuk makaleleri tek ve kurumsal bir tasarım dili kullanacaktır.  
Bu standardın tek referansı master şablondur:

- `anonim-sirketlerde-genel-kurul-suresinde-yapilmazsa-ne-olur.html`
