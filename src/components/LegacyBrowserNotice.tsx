import { TAVLE_PATH } from "@/lib/tavle/render";

const NOTICE_ID = "legacy-browser-notice";
const LINK_ID = "legacy-browser-link";

/**
 * Shows the notice on browsers too old for this app (Next.js 16 needs
 * Safari 16.4+, Chrome/Edge 111+, Firefox 111+). React never runs there, so
 * this is a plain inline script that runs while the HTML is parsed.
 *
 * - Regex lookbehind is missing before Safari 16.4.
 * - oklch() colours (used by Tailwind 4) are missing before Chrome 111,
 *   Firefox 113 and Safari 15.4.
 *
 * Plain ES5 on purpose. The link carries over ?stasjon=…&tema=….
 */
const DETECT_SCRIPT = `(function(){try{
var ok=true;
try{new RegExp("(?<=a)b");}catch(e){ok=false;}
if(ok){ok=typeof CSS!=="undefined"&&typeof CSS.supports==="function"&&CSS.supports("color","oklch(0 0 0)");}
if(ok)return;
document.getElementById(${JSON.stringify(LINK_ID)}).href=${JSON.stringify(TAVLE_PATH)}+location.search;
document.getElementById(${JSON.stringify(NOTICE_ID)}).style.display="block";
}catch(e){}})();`;

/**
 * Styled inline because Tailwind's CSS doesn't apply in the old browsers this
 * is meant for.
 */
export function LegacyBrowserNotice() {
  return (
    <>
      <div
        id={NOTICE_ID}
        role="alert"
        suppressHydrationWarning
        style={{
          display: "none",
          margin: "16px",
          padding: "16px 20px",
          border: "1px solid #f59e0b",
          borderRadius: "8px",
          background: "#fef3c7",
          color: "#451a03",
          fontFamily: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: "18px",
          lineHeight: 1.4,
        }}
      >
        <strong>Denne nettleseren er for gammel for avgangstavla.</strong> Bruk den enkle versjonen,
        som fungerer på eldre iPader og nettlesere:{" "}
        <a
          id={LINK_ID}
          href={TAVLE_PATH}
          suppressHydrationWarning
          style={{ color: "#92400e", fontWeight: 600 }}
        >
          Åpne enkel tavle →
        </a>
      </div>
      <script dangerouslySetInnerHTML={{ __html: DETECT_SCRIPT }} />
    </>
  );
}
