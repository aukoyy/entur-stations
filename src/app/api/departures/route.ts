import { fetchDepartures } from "@/lib/entur";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchDepartures();
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return Response.json({ error: message }, { status: 502 });
  }
}
