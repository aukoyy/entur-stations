/**
 * Inline browser script for /tavle. Plain ES5 on purpose (no arrow functions,
 * let/const, fetch, or optional chaining) so it runs on old iPads.
 *
 * - Ticks the clock every second from the device clock.
 * - Polls the JSON variant of the page and swaps in new markup. On failure it
 *   keeps the last board on screen, so a Wi-Fi blip never leaves a browser
 *   error page behind (which a plain meta refresh would).
 * - Swapping the board leaves the page's scroll position alone.
 * - Every few seconds, and after each poll, updates each row from its data-t
 *   (departure time) and its board's data-travel: countdown, faded when it's
 *   too late to get there, the leave hint on the first train you can make,
 *   and hidden once the train has left. Same rules as
 *   src/lib/departure-status.ts; keep them in sync.
 * - Shows an "Utdatert" warning when there has been no update for a while.
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
  var stale = document.getElementById("stale");
  var lastUpdate = startedAt;

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function hhmm(date) { return pad(date.getHours()) + ":" + pad(date.getMinutes()); }

  function tick() { clock.textContent = hhmm(new Date()); }

  function applyTheme(theme) {
    document.documentElement.className = theme === "dark" ? "dark" : "";
  }

  function countdownText(msUntil) {
    var minutes = Math.floor(msUntil / 60000);
    if (minutes >= config.countdownWithinMinutes) return "";
    return minutes < 1 ? "n\u00e5" : "om " + minutes + " min";
  }

  function setClass(element, name, on) {
    var has = (" " + element.className + " ").indexOf(" " + name + " ") >= 0;
    if (on && !has) element.className += " " + name;
    if (!on && has) element.className = (" " + element.className + " ").replace(" " + name + " ", " ").replace(/^ +| +$/g, "");
  }

  function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  function refresh() {
    var now = new Date().getTime();
    var boardList = boards.querySelectorAll(".board");
    for (var b = 0; b < boardList.length; b++) {
      var board = boardList[b];
      var travelAttr = board.getAttribute("data-travel");
      var travel = travelAttr ? Number(travelAttr) : null;
      var verb = board.getAttribute("data-verb") || "";
      var hintGiven = false;
      var rows = board.querySelectorAll(".dep");
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var msUntil = Number(row.getAttribute("data-t")) - now;
        if (-msUntil > config.departedAfterMs) {
          row.style.display = "none";
          continue;
        }
        var cancelled = row.getAttribute("data-cancelled") === "1";
        var missed = travel !== null && !cancelled && msUntil < travel;
        setClass(row, "is-missed", missed);
        setText(row.querySelector(".countdown"), cancelled ? "" : countdownText(msUntil));

        var hint = "";
        if (travel !== null && !hintGiven && !cancelled && !missed) {
          hintGiven = true;
          var leaveIn = Math.floor((msUntil - travel) / 60000);
          if (leaveIn < config.countdownWithinMinutes) {
            hint = leaveIn < 1 ? verb + " n\u00e5" : verb + " om " + leaveIn + "'";
          }
        }
        setText(row.querySelector(".tag.leave"), hint);
      }
    }

    setText(
      stale,
      now - lastUpdate > config.staleAfterMs
        ? "Utdatert: sist oppdatert " + hhmm(new Date(lastUpdate)) + ". Avgangene kan ha endret seg."
        : ""
    );
  }

  function showFailure() {
    status.innerHTML =
      '<p class="error">Kunne ikke oppdatere ' + hhmm(new Date()) + '</p>' +
      '<p class="small">Viser sist hentede avganger</p>';
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
      boards.className = data.boardsClass;
      boards.innerHTML = data.boards;
      lastUpdate = new Date().getTime();
      refresh();
    };
    xhr.onerror = showFailure;
    xhr.ontimeout = showFailure;
    xhr.send();
  }

  // Start at the top after a reload instead of where the page was scrolled to.
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

  tick();
  refresh();
  window.setInterval(tick, 1000);
  window.setInterval(refresh, 10000);
  window.setInterval(poll, config.pollMs);
})();
`;
