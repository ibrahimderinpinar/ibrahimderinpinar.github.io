/*
 * DERINPINAR.AV.TR
 * Makale Kaynak Koruma Sistemi
 *
 * Yazar: Av. Dr. İbrahim Nuri Derinpınar
 *
 * Amaç:
 * Makale içeriğinden belirli uzunluğun üzerinde metin kopyalandığında
 * kopyalanan metnin sonuna otomatik olarak makale künyesi ve
 * canonical URL eklemek.
 */

(function () {
    "use strict";

    /* ---------------------------------------------------------
       AYARLAR
    --------------------------------------------------------- */

    const AUTHOR_NAME = "Av. Dr. İbrahim Nuri Derinpınar";
    const SITE_NAME = "derinpinar.av.tr";

    // Bundan daha kısa seçimlerde kaynak eklenmez.
    const MIN_COPY_LENGTH = 80;

    /*
     * Makale içerik alanını tespit etmek için kullanılabilecek
     * seçiciler. İlk bulunan uygun alan kullanılır.
     */
    const ARTICLE_SELECTORS = [
        "article",
        ".article-content",
        ".article-body",
        ".post-content",
        ".post-body",
        ".entry-content",
        "main article"
    ];

    /*
     * Makalenin içinde olsa bile kaynak ekleme sisteminin
     * çalışmasını istemediğimiz alanlar.
     */
    const EXCLUDED_SELECTORS = [
        "header",
        "nav",
        "footer",
        "button",
        "input",
        "textarea",
        "select",
        "option",
        "code",
        "pre",
        ".share-buttons",
        ".social-share",
        ".article-share",
        ".related-articles",
        ".related-posts",
        ".breadcrumb",
        ".breadcrumbs"
    ].join(",");


    /* ---------------------------------------------------------
       YARDIMCI FONKSİYONLAR
    --------------------------------------------------------- */

    function findArticle() {
        for (const selector of ARTICLE_SELECTORS) {
            const article = document.querySelector(selector);

            if (article) {
                return article;
            }
        }

        return null;
    }


    function getSelectedElement(selection) {
        if (!selection || !selection.anchorNode) {
            return null;
        }

        const node = selection.anchorNode;

        if (node.nodeType === Node.TEXT_NODE) {
            return node.parentElement;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            return node;
        }

        return null;
    }


    function getArticleTitle() {

        /*
         * Öncelik:
         * 1. Makalenin H1 başlığı
         * 2. Sayfadaki ilk H1
         * 3. og:title
         * 4. document.title
         */

        const article = findArticle();

        if (article) {
            const articleH1 = article.querySelector("h1");

            if (articleH1 && articleH1.textContent.trim()) {
                return articleH1.textContent.trim();
            }
        }

        const pageH1 = document.querySelector("h1");

        if (pageH1 && pageH1.textContent.trim()) {
            return pageH1.textContent.trim();
        }

        const ogTitle = document.querySelector(
            'meta[property="og:title"]'
        );

        if (ogTitle && ogTitle.content.trim()) {
            return ogTitle.content.trim();
        }

        return document.title.trim();
    }


    function getCanonicalUrl() {

        /*
         * Öncelikle canonical URL kullanılır.
         * Böylece www, query parameter vb. varyasyonların
         * kaynak olarak eklenmesi önlenir.
         */

        const canonical = document.querySelector(
            'link[rel="canonical"]'
        );

        if (canonical && canonical.href) {
            return canonical.href;
        }

        /*
         * Canonical bulunamazsa mevcut URL kullanılır.
         * Hash (#...) temizlenir.
         */

        const url = new URL(window.location.href);

        url.hash = "";

        return url.href;
    }


    function normalizeText(text) {
        return text
            .replace(/\u00A0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }


    function isSelectionInsideArticle(selection, article) {

        if (!selection || !article || selection.rangeCount === 0) {
            return false;
        }

        const range = selection.getRangeAt(0);

        const startContainer =
            range.startContainer.nodeType === Node.TEXT_NODE
                ? range.startContainer.parentElement
                : range.startContainer;

        const endContainer =
            range.endContainer.nodeType === Node.TEXT_NODE
                ? range.endContainer.parentElement
                : range.endContainer;

        if (!startContainer || !endContainer) {
            return false;
        }

        /*
         * Seçimin hem başlangıcının hem de sonunun
         * makale içerisinde olmasını şart koşuyoruz.
         */

        return (
            article.contains(startContainer) &&
            article.contains(endContainer)
        );
    }


    /* ---------------------------------------------------------
       COPY EVENT
    --------------------------------------------------------- */

    document.addEventListener("copy", function (event) {

        const selection = window.getSelection();

        if (
            !selection ||
            selection.isCollapsed ||
            selection.rangeCount === 0
        ) {
            return;
        }

        const selectedText = normalizeText(
            selection.toString()
        );

        /*
         * Kullanıcı yalnızca kısa bir kelime, hukuk terimi,
         * kişi adı vb. kopyalıyorsa müdahale etmiyoruz.
         */

        if (selectedText.length < MIN_COPY_LENGTH) {
            return;
        }

        const article = findArticle();

        /*
         * Sayfa bir makale değilse hiçbir şey yapma.
         */

        if (!article) {
            return;
        }

        /*
         * Seçilen metin gerçekten makalenin içerisinde mi?
         */

        if (!isSelectionInsideArticle(selection, article)) {
            return;
        }

        const selectedElement =
            getSelectedElement(selection);

        if (!selectedElement) {
            return;
        }

        /*
         * Menü, buton, kod bloğu, ilgili makaleler vb.
         * alanlardan yapılan kopyalamalara müdahale etmiyoruz.
         */

        if (selectedElement.closest(EXCLUDED_SELECTORS)) {
            return;
        }


        /* -----------------------------------------------------
           KAYNAK BİLGİSİ
        ----------------------------------------------------- */

        const articleTitle = getArticleTitle();
        const articleUrl = getCanonicalUrl();

        const sourceText =
            "\n\n" +
            "Kaynak: " +
            AUTHOR_NAME +
            ', "' +
            articleTitle +
            '", ' +
            SITE_NAME +
            "\n" +
            articleUrl;


        const finalPlainText =
            selectedText + sourceText;


        /* -----------------------------------------------------
           PANOYA DÜZ METİN YAZ
        ----------------------------------------------------- */

        if (
            event.clipboardData &&
            typeof event.clipboardData.setData === "function"
        ) {

            event.clipboardData.setData(
                "text/plain",
                finalPlainText
            );


            /*
             * HTML destekleyen uygulamalara yapıştırıldığında
             * kaynak bağlantısının tıklanabilir olması için
             * HTML sürümünü de hazırlıyoruz.
             */

            const escapeHtml = function (value) {
                return value
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            };

            const safeText =
                escapeHtml(selectedText)
                    .replace(/\n/g, "<br>");

            const safeAuthor =
                escapeHtml(AUTHOR_NAME);

            const safeTitle =
                escapeHtml(articleTitle);

            const safeSite =
                escapeHtml(SITE_NAME);

            const safeUrl =
                escapeHtml(articleUrl);


            const finalHtml =
                safeText +
                "<br><br>" +
                "<strong>Kaynak:</strong> " +
                safeAuthor +
                ', &quot;' +
                safeTitle +
                '&quot;, ' +
                safeSite +
                "<br>" +
                '<a href="' +
                safeUrl +
                '">' +
                safeUrl +
                "</a>";


            event.clipboardData.setData(
                "text/html",
                finalHtml
            );

            event.preventDefault();
        }
    });

})();
