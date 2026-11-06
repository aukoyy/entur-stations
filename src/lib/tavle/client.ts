/**
 * Inline browser script for /tavle. Plain ES5 on purpose (no arrow functions,
 * let/const, fetch, or optional chaining) so it runs on old iPads.
 *
 * - Ticks the clock every second from the device clock.
 * - Polls the JSON variant of the page and swaps in new markup. On failure it
 *   keeps the last board on screen, so a Wi-Fi blip never leaves a browser
 *   error page behind (which a plain meta refresh would).
 * - Keeps each station list's scroll position across polls (landscape, where
 *   lists scroll on their own; in portrait the page scrolls and the swap
 *   leaves the page position alone).
 * - Reloads the whole page every few hours, but only right after a successful
 *   poll, to pick up new deploys. The reload also scrolls back to the top, so
 *   a board someone scrolled down doesn't stay that way.
 */
export const TAVLE_CLIENT_SCRIPT = `
(function () {
  var config = window.TAVLE_CONFIG;
  var startedAt = new Date().getTime();
  var clock = document.getElementById("clock");
  var status = document.getElementById("status");
  var boards = document.getElementById("boards");

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function hhmm(date) { return pad(date.getHours()) + ":" + pad(date.getMinutes()); }

  function tick() { clock.textContent = hhmm(new Date()); }

  function applyTheme(theme) {
    document.documentElement.className = theme === "dark" ? "dark" : "";
  }

  function showFailure() {
    status.innerHTML =
      '<p class="error">Kunne ikke oppdatere ' + hhmm(new Date()) + '</p>' +
      '<p class="small">Viser sist hentede avganger</p>';
  }

  function lists() { return boards.querySelectorAll(".list"); }

  function scrollPositions() {
    var current = lists();
    var tops = [];
    for (var i = 0; i < current.length; i++) tops.push(current[i].scrollTop);
    return tops;
  }

  function restoreScroll(tops) {
    var current = lists();
    for (var i = 0; i < current.length && i < tops.length; i++) current[i].scrollTop = tops[i];
  }

  function poll() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", config.pollUrl + "&t=" + new Date().getTime(), true);
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status !== 200) { showFailure(); return; }
      var data;
      try { data = JSON.parse(xhr.responseText); } catch (e) { showFailure(); return; }
      if (new Date().getTime() - startedAt > config.reloadMs) {
        window.location.reload();
        return;
      }
      applyTheme(data.theme);
      status.innerHTML = data.status;
      var tops = scrollPositions();
      boards.className = data.boardsClass;
      boards.innerHTML = data.boards;
      restoreScroll(tops);
    };
    xhr.onerror = showFailure;
    xhr.ontimeout = showFailure;
    xhr.send();
  }

  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  restoreScroll([0, 0]);

  tick();
  window.setInterval(tick, 1000);
  window.setInterval(poll, config.pollMs);
})();
`;
