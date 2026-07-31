(function () {
  var SEARCH_PAGE = "makaleler.html";

  function getCurrentQuery() {
    try {
      return (new URL(window.location.href)).searchParams.get("q") || "";
    } catch (error) {
      return "";
    }
  }

  function toSearchPageUrl(query) {
    var url = new URL(SEARCH_PAGE, window.location.href);
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }
    return url.pathname.replace(/^\//, "") + url.search + "#tum-makaleler";
  }

  function requestQuery(initialValue) {
    var value = window.prompt("Aramak istediğiniz konu veya anahtar kelimeyi yazın:", initialValue || "");
    if (value === null) {
      return null;
    }
    return value.trim();
  }

  function isArticlesPage() {
    return /(?:^|\/)makaleler\.html$/i.test(window.location.pathname);
  }

  function dispatchQueryChange(query) {
    window.dispatchEvent(new CustomEvent("site-search:request", { detail: { query: query || "" } }));
  }

  function handleSearchButtonClick(event) {
    event.preventDefault();

    var query = requestQuery(getCurrentQuery());
    if (query === null) {
      return;
    }

    if (isArticlesPage()) {
      var url = new URL(window.location.href);
      if (query) {
        url.searchParams.set("q", query);
      } else {
        url.searchParams.delete("q");
      }
      history.replaceState(null, "", url.pathname + url.search + url.hash);
      dispatchQueryChange(query);
      return;
    }

    window.location.href = toSearchPageUrl(query);
  }

  function initSearchButtons() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".gtb-search-btn"));
    buttons.forEach(function (button) {
      button.addEventListener("click", handleSearchButtonClick);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchButtons);
  } else {
    initSearchButtons();
  }
})();
