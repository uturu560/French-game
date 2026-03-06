(function () {
  "use strict";
  var THEME_KEY = "matchingGameCopyTheme";
  try {
    var saved = localStorage.getItem(THEME_KEY);
    var theme = saved === "light" ? "light" : "dark";
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  } catch (_) {}
})();
