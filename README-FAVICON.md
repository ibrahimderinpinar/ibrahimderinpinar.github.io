# Derinpınar favicon güncellemesi

Bu klasördeki dosyalar, `derinpinar.av.tr` alan adında görünen eski dünya simgesini
Derinpınar Law & Consultancy kurumsal logosuyla değiştirmek için hazırlanmıştır.

## GitHub'a yükleme

1. Bu paketteki **tüm dosyaları** sitenin depo kök dizinine yükleyin.
2. GitHub mevcut dosyalar için sorarsa `Replace files` / üzerine yazma işlemini kabul edin.
3. Özellikle `index.html`, `favicon.ico`, PNG ikonları ve `site.webmanifest` dosyasının
   depo kökünde bulunduğunu kontrol edin.
4. Önerilen commit mesajı:

   `Replace globe favicon with DLC brand logo`

## Yayından sonra kontrol

Tarayıcı önbelleği nedeniyle eski simge bir süre görünebilir. Yayın tamamlandıktan sonra
aşağıdaki adreslerin kurumsal logoyu gösterdiğini kontrol edin:

- `https://derinpinar.av.tr/favicon.ico`
- `https://derinpinar.av.tr/favicon-48x48.png`
- `https://derinpinar.av.tr/favicon-512x512.png`
- `https://derinpinar.av.tr/site.webmanifest`

Google arama sonucundaki favicon anında değişmeyebilir. Google Search Console'da ana sayfa
(`https://derinpinar.av.tr/`) için **URL Denetimi → Canlı URL'yi Test Et → Dizine Eklenmesini İste**
işlemini uygulayın. Google sayfayı yeniden taradığında yeni simge görünür.

## Teknik not

Google arama favicons için kare ve taranabilir bir ikon bekler. Paket, aynı kurumsal logonun
16, 32, 48, 180, 192 ve 512 piksellik sürümlerini ve çok boyutlu `favicon.ico` dosyasını içerir.
HTML bağlantılarındaki `v=20260903` parametresi eski ikon önbelleğini tek seferlik kırar.
