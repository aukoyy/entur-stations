import { fetchDepartures, type DeparturesPayload } from "@/lib/entur";
import { parseTavleOptions, renderTavlePage, renderTavleParts } from "@/lib/tavle/render";

/**
 * Departure board for old browsers (e.g. iPads stuck on iOS 12).
 *
 * The main app needs Safari 16.4+ (Next.js 16, React 19, Tailwind 4). This
 * route skips all of that: it returns hand-written HTML, CSS and a small ES5
 * script, so nothing depends on modern browser features.
 *
 * `?format=json` returns only the changing parts; the page's script polls it.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const options = parseTavleOptions(params);
  const now = new Date();

  let payload: DeparturesPayload | null = null;
  let error: string | null = null;
  try {
    payload = await fetchDepartures();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Ukjent feil";
  }

  if (params.get("format") === "json") {
    if (!payload) {
      return Response.json({ error }, { status: 502, headers: NO_STORE });
    }
    return Response.json(renderTavleParts(payload, options, now), { headers: NO_STORE });
  }

  return new Response(renderTavlePage({ payload, error, options, now }), {
    headers: { ...NO_STORE, "Content-Type": "text/html; charset=utf-8" },
  });
}
