(function () {
  var SEARCH_INDEX_PATH = "search-index.json";
  var MAX_RESULTS = 12;
  var MAX_SUGGESTIONS = 6;

  var state = {
    index: [],
    ready: null,
    query: "",
    results: [],
    suggestions: []
  };

  function normalize(value) {
    return String(value || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitTerms(query) {
    return normalize(query)
      .split(" ")
      .map(function (part) { return part.trim(); })
      .filter(Boolean);
  }

  function readQueryFromUrl() {
    try {
      return new URL(window.location.href).searchParams.get("q") || "";
    } catch (error) {
      return "";
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function truncate(value, maxLength) {
    var text = String(value || "").trim();
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1).trimEnd() + "…";
  }

  function getEntryKeywords(entry) {
    if (!entry || !Array.isArray(entry.keywords)) return [];
    return entry.keywords
      .map(function (item) { return String(item || "").trim(); })
      .filter(Boolean);
  }

  function resolveUrl(url) {
    var clean = String(url || "").trim();
    if (!clean) return "#";
    if (/^https?:\/\//i.test(clean)) return clean;
    return clean.replace(/^\//, "");
  }

  function buildSearchDocument(entry) {
    var title = String(entry.title || "");
    var excerpt = String(entry.excerpt || "");
    var category = String(entry.category || "");
    var content = String(entry.content || "");
    var keywordList = getEntryKeywords(entry);
    var keywords = keywordList.join(" ");

    return {
      title: title,
      excerpt: excerpt,
      category: category,
      content: content,
      keywords: keywords,
      keywordList: keywordList,
      readingTime: String(entry.reading_time || "").trim(),
      url: resolveUrl(entry.url),
      norm: {
        title: normalize(title),
        excerpt: normalize(excerpt),
        category: normalize(category),
        content: normalize(content),
        keywords: normalize(keywords),
        all: normalize([title, excerpt, category, keywords, content].join(" "))
      }
    };
  }

  function termScore(term, doc) {
    var score = 0;
    if (doc.norm.title.indexOf(term) !== -1) score += 50;
    if (doc.norm.excerpt.indexOf(term) !== -1) score += 20;
    if (doc.norm.category.indexOf(term) !== -1) score += 15;
    if (doc.norm.keywords.indexOf(term) !== -1) score += 25;
    if (doc.norm.content.indexOf(term) !== -1) score += 5;
    return score;
  }

  function searchEntries(query) {
    var terms = splitTerms(query);
    if (!terms.length) return [];

    return state.index
      .map(function (doc) {
        var everyTermMatched = terms.every(function (term) {
          return doc.norm.all.indexOf(term) !== -1;
        });

        if (!everyTermMatched) return null;

        var score = terms.reduce(function (total, term) {
          return total + termScore(term, doc);
        }, 0);

        return { doc: doc, score: score };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, MAX_RESULTS)
      .map(function (item) { return item.doc; });
  }

  function collectSuggestions(query) {
    var term = normalize(query);
    if (!term) return [];

    var suggestions = [];
    var seen = {};

    state.index.forEach(function (doc) {
      [doc.title, doc.category]
        .concat(doc.keywordList || [])
        .forEach(function (candidate) {
          var value = String(candidate || "").trim();
          if (!value) return;
          var valueNorm = normalize(value);
          if (valueNorm.indexOf(term) === -1) return;
          if (seen[valueNorm]) return;
          seen[valueNorm] = true;
          suggestions.push(value);
        });
    });

    return suggestions.slice(0, MAX_SUGGESTIONS);
  }

  function ensureUi() {
    if (document.getElementById("siteSearchOverlay")) return;

    var style = document.createElement("style");
    style.id = "siteSearchStyles";
    style.textContent = ""
      + ".site-search-overlay{position:fixed;inset:0;background:rgba(0,0,0,.42);backdrop-filter:blur(3px);display:none;align-items:flex-start;justify-content:center;padding:64px 16px 24px;z-index:12000;}"
      + ".site-search-overlay.active{display:flex;}"
      + ".site-search-modal{width:min(880px,100%);max-height:calc(100vh - 88px);overflow:hidden;border-radius:18px;border:1px solid rgba(0,0,0,.08);background:#fff;box-shadow:0 16px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;}"
      + ".site-search-head{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid #ece8e2;}"
      + ".site-search-input{width:100%;padding:12px 14px;font-size:16px;border:1px solid #d8d2c9;border-radius:10px;outline:none;}"
      + ".site-search-input:focus{border-color:#c89b3c;box-shadow:0 0 0 3px rgba(200,155,60,.18);}"
      + ".site-search-close{border:0;background:#f5f2ec;color:#1f2d47;width:40px;height:40px;border-radius:10px;font-size:20px;cursor:pointer;}"
      + ".site-search-body{overflow:auto;padding:10px 16px 16px;}"
      + ".site-search-meta{font-size:13px;color:#666;margin:4px 0 8px;}"
      + ".site-search-suggestions{display:flex;gap:8px;flex-wrap:wrap;padding:0;margin:0 0 10px;list-style:none;}"
      + ".site-search-suggestion{border:1px solid #e5dfd5;background:#fcfbf8;padding:6px 10px;border-radius:999px;font-size:13px;color:#1f2d47;cursor:pointer;}"
      + ".site-search-results{display:grid;grid-template-columns:1fr;gap:10px;}"
      + ".site-search-card{display:block;border:1px solid #ece8e2;border-radius:12px;padding:12px 13px;background:#fff;color:inherit;text-decoration:none;transition:.15s ease;}"
      + ".site-search-card:hover{border-color:#c89b3c;box-shadow:0 3px 10px rgba(0,0,0,.08);transform:translateY(-1px);}"
      + ".site-search-card-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:5px;}"
      + ".site-search-title{margin:0;font-size:16px;line-height:1.35;color:#1f2d47;}"
      + ".site-search-category,.site-search-reading{font-size:12px;color:#5c5549;background:#f5f1ea;border-radius:999px;padding:4px 9px;white-space:nowrap;}"
      + ".site-search-excerpt{margin:7px 0 0;font-size:14px;line-height:1.5;color:#514c43;}"
      + ".site-search-link{margin-top:8px;font-size:13px;font-weight:600;color:#1f2d47;}"
      + ".site-search-empty{display:none;padding:18px 6px;color:#666;font-size:14px;}"
      + ".site-search-empty.active{display:block;}"
      + "@media (max-width:640px){.site-search-overlay{padding:14px 8px;}.site-search-modal{max-height:calc(100vh - 28px);}.site-search-head{padding:10px;}.site-search-input{font-size:15px;}.site-search-title{font-size:15px;}.site-search-card-top{flex-direction:column;gap:6px;align-items:flex-start;}}";

    document.head.appendChild(style);

    var overlay = document.createElement("div");
    overlay.id = "siteSearchOverlay";
    overlay.className = "site-search-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Site içi arama");

    overlay.innerHTML = ""
      + '<div class="site-search-modal">'
      + '  <div class="site-search-head">'
      + '    <input id="siteSearchInput" class="site-search-input" type="search" placeholder="Makale başlığı, özet, kategori veya anahtar kelime ara" autocomplete="off" />'
      + '    <button id="siteSearchClose" class="site-search-close" type="button" aria-label="Aramayı kapat">×</button>'
      + "  </div>"
      + '  <div class="site-search-body">'
      + '    <div id="siteSearchMeta" class="site-search-meta">Yazmaya başlayın.</div>'
      + '    <ul id="siteSearchSuggestions" class="site-search-suggestions" aria-label="Arama önerileri"></ul>'
      + '    <div id="siteSearchResults" class="site-search-results" aria-live="polite"></div>'
      + '    <div id="siteSearchEmpty" class="site-search-empty">Eşleşen sonuç bulunamadı.</div>'
      + "  </div>"
      + "</div>";

    document.body.appendChild(overlay);
  }

  function getUi() {
    ensureUi();
    return {
      overlay: document.getElementById("siteSearchOverlay"),
      input: document.getElementById("siteSearchInput"),
      close: document.getElementById("siteSearchClose"),
      meta: document.getElementById("siteSearchMeta"),
      suggestions: document.getElementById("siteSearchSuggestions"),
      results: document.getElementById("siteSearchResults"),
      empty: document.getElementById("siteSearchEmpty")
    };
  }

  function renderSuggestions(ui) {
    ui.suggestions.innerHTML = "";
    if (!state.query) return;

    state.suggestions.forEach(function (text) {
      var li = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "site-search-suggestion";
      button.textContent = text;
      button.addEventListener("click", function () {
        ui.input.value = text;
        performSearch(text, ui);
        ui.input.focus();
      });
      li.appendChild(button);
      ui.suggestions.appendChild(li);
    });
  }

  function renderResults(ui) {
    ui.results.innerHTML = "";

    state.results.forEach(function (doc) {
      var card = document.createElement("a");
      card.className = "site-search-card";
      card.href = doc.url;

      card.innerHTML = ""
        + '<div class="site-search-card-top">'
        + '  <h3 class="site-search-title">' + escapeHtml(doc.title) + "</h3>"
        + '  <div style="display:flex;gap:6px;flex-wrap:wrap;">'
        + (doc.category ? '<span class="site-search-category">' + escapeHtml(doc.category) + "</span>" : "")
        + (doc.readingTime ? '<span class="site-search-reading">' + escapeHtml(doc.readingTime) + "</span>" : "")
        + "  </div>"
        + "</div>"
        + '<p class="site-search-excerpt">' + escapeHtml(truncate(doc.excerpt || doc.content, 190)) + "</p>"
        + '<div class="site-search-link">Makaleye git →</div>';

      ui.results.appendChild(card);
    });
  }

  function performSearch(query, ui) {
    state.query = String(query || "").trim();

    if (!state.query) {
      state.results = [];
      state.suggestions = [];
      ui.meta.textContent = "Yazmaya başlayın.";
      ui.empty.classList.remove("active");
      ui.results.innerHTML = "";
      ui.suggestions.innerHTML = "";
      return;
    }

    state.results = searchEntries(state.query);
    state.suggestions = collectSuggestions(state.query);

    ui.meta.textContent = state.results.length + " sonuç bulundu.";
    ui.empty.classList.toggle("active", state.results.length === 0);

    renderSuggestions(ui);
    renderResults(ui);
  }

  function openSearch(initialQuery) {
    var ui = getUi();
    ui.overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    if (typeof initialQuery === "string") {
      ui.input.value = initialQuery;
    }

    performSearch(ui.input.value, ui);

    window.requestAnimationFrame(function () {
      ui.input.focus();
      ui.input.setSelectionRange(ui.input.value.length, ui.input.value.length);
    });
  }

  function closeSearch() {
    var ui = getUi();
    ui.overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  function bindUiEvents() {
    var ui = getUi();

    ui.close.addEventListener("click", closeSearch);
    ui.overlay.addEventListener("click", function (event) {
      if (event.target === ui.overlay) closeSearch();
    });

    ui.input.addEventListener("input", function () {
      performSearch(ui.input.value, ui);
    });

    ui.input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSearch();
      }
    });

    document.addEventListener("keydown", function (event) {
      var activeTag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
      var typing = activeTag === "input" || activeTag === "textarea";

      if (event.key === "/" && !typing) {
        event.preventDefault();
        openSearch("");
      }

      if (event.key === "Escape" && ui.overlay.classList.contains("active")) {
        closeSearch();
      }
    });

    Array.prototype.slice.call(document.querySelectorAll(".gtb-search-btn")).forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openSearch(readQueryFromUrl());
      });
    });

    window.addEventListener("site-search:request", function (event) {
      var query = event && event.detail && event.detail.query ? String(event.detail.query) : "";
      openSearch(query);
    });
  }

  function loadIndex() {
    if (state.ready) return state.ready;

    state.ready = fetch(SEARCH_INDEX_PATH, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("Search index yüklenemedi");
        return response.json();
      })
      .then(function (json) {
        state.index = Array.isArray(json) ? json.map(buildSearchDocument) : [];
      })
      .catch(function () {
        state.index = [];
      });

    return state.ready;
  }

  function init() {
    ensureUi();
    bindUiEvents();
    loadIndex().then(function () {
      var presetQuery = readQueryFromUrl().trim();
      if (presetQuery) {
        openSearch(presetQuery);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
