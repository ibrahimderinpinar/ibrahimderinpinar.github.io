# Firebase Realtime Database — Görüntülenme Sayacı Kurulumu

Bu belge, makalelerdeki görüntülenme sayacının Firebase Realtime Database üzerinde nasıl çalıştığını ve nasıl kurulacağını açıklar.

---

## Neden Firebase?

Önceki sistem `localStorage` kullanıyordu. `localStorage` **tarayıcı başına** veri saklar; yani her ziyaretçi kendi sayacını sıfırdan başlatır, sayılar kullanıcılar arasında paylaşılmaz. Bu nedenle gerçek bir görüntülenme sayacı değildi.

Firebase Realtime Database:
- **Sunucu tarafında** veri saklar — tüm ziyaretçiler aynı sayacı paylaşır
- Deploy, cache temizliği veya sunucu yeniden başlatması sayacı etkilemez
- **Atomik sunucu taraflı artırım** (`{".sv": {"increment": 1}}`) — eş zamanlı isteklerde veri kaybı olmaz
- Static GitHub Pages sitesiyle sorunsuz çalışır (SDK gerektirmez, sadece `fetch`)
- Ücretsiz Spark planı bu kullanım için yeterlidir

---

## Kurulum Adımları

### 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. **"Add project"** → proje adını girin (örn. `ibrahimderinpinar`) → **Continue**
3. Google Analytics: isteğe bağlı → **Create project**

### 2. Realtime Database Oluşturma

1. Sol menüden **Build → Realtime Database** → **Create Database**
2. Bölge olarak **europe-west1 (Belgium)** önerilir (coğrafi yakınlık)
3. Güvenlik modu: **"Start in test mode"** seçin (kuralları sonraki adımda düzenleyeceğiz)
4. **Enable**

### 3. Veritabanı URL'sini Not Alma

Oluşturulan veritabanının URL'si şu formatta olur:
```
https://YOUR_PROJECT_ID-default-rtdb.europe-west1.firebasedatabase.app
```
veya ABD bölgesi için:
```
https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com
```

### 4. Güvenlik Kurallarını Ayarlama

**Realtime Database → Rules** sekmesine gidin ve şu kuralları yapıştırın:

```json
{
  "rules": {
    "views": {
      ".read": true,
      ".write": true
    }
  }
}
```

> **Not:** Bu kurallar sadece `/views/` yoluna açık erişim verir. Diğer tüm yollar varsayılan olarak kapalıdır. Görüntülenme sayıları zaten herkese açık veri olduğundan bu yapılandırma güvenlidir.

**Publish** butonuna basın.

### 5. HTML Dosyalarında URL'yi Güncelleme

Her makale HTML dosyasındaki şu satırı kendi Firebase URL'niz ile değiştirin:

```javascript
var FIREBASE_DB_URL = "https://ibrahimderinpinar-default-rtdb.firebaseio.com";
```

Örnek (europe-west1 bölgesi için):
```javascript
var FIREBASE_DB_URL = "https://ibrahimderinpinar-default-rtdb.europe-west1.firebasedatabase.app";
```

---

## Çalışma Mantığı

Her makale sayfası yüklendiğinde şu istek gönderilir:

```
PATCH https://{db-url}/views/{articleId}.json
Content-Type: application/json

{"count": {".sv": {"increment": 1}}}
```

Firebase, `count` değerini sunucu tarafında atomik olarak 1 artırır ve yeni değeri yanıtta döner:

```json
{"count": 42}
```

Bu değer `viewsChip` elementinde gösterilir. Eğer istek başarısız olursa chip `"👁 —"` gösterir ve sayfa yüklemesi engellenmez.

---

## Makale ID Tablosu

| Dosya | `articleId` |
|---|---|
| `e-spor-nedir-hukuki-acidan-e-spor-kavrami-ve-unsurlari.html` | `espor-001` |
| `anonim-sirketlerde-genel-kurul-suresinde-yapilmazsa-ne-olur.html` | `sirketler-001` |

Yeni makale eklerken bir sonraki sıradaki ID'yi kullanın (örn. `espor-002`, `sirketler-002`).

---

## Migration (Mevcut Sayılar)

Önceki `localStorage` tabanlı sistem kullanıcı başına veri sakladığı için merkezi bir sayaç değeri yoktur — migrate edilecek ortak bir veri bulunmamaktadır. Firebase sayaçları sıfırdan başlar.

İstersen başlangıç değeri manuel olarak atanabilir:

```
PUT https://{db-url}/views/{articleId}/count.json
Content-Type: application/json

250
```

Bu işlem Firebase Console'daki **Data** sekmesinden de yapılabilir.

---

## Aylık Kullanım Tahmini (Spark Ücretsiz Plan)

| Metrik | Limit | Tahmini Kullanım |
|---|---|---|
| Depolama | 1 GB | < 1 KB |
| İndirme | 10 GB/ay | ~ 50 byte × ziyaret sayısı |
| Eş zamanlı bağlantı | 100 | Genellikle 1-2 |

Kişisel blog ölçeğinde limit aşımı neredeyse imkânsızdır.
