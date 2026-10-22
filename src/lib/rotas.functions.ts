import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export interface EstimativaRota {
  distanciaKm: number;
  tempoMin: number;
}

/** Calcula distância e tempo entre dois endereços (Google Routes). */
export const estimarRota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origem: string; destino: string }) => {
    const origem = String(d?.origem ?? "").trim();
    const destino = String(d?.destino ?? "").trim();
    if (!origem || !destino || origem.length > 300 || destino.length > 300) {
      throw new Error("Informe origem e destino válidos.");
    }
    return { origem, destino };
  })
  .handler(async ({ data }): Promise<EstimativaRota> => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Google Maps não configurado.");

    const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: data.origem },
        destination: { address: data.destino },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        languageCode: "pt-BR",
        regionCode: "BR",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Routes falhou [${res.status}]: ${body}`);
      throw new Error(`Não foi possível calcular a rota (${res.status}).`);
    }
    const json: any = await res.json();
    const r = json?.routes?.[0];
    if (!r || typeof r.duration !== "string") throw new Error("Rota não encontrada para esses endereços.");
    const seg = parseFloat(r.duration.replace("s", ""));
    return {
      distanciaKm: Number(r.distanceMeters ?? 0) / 1000,
      tempoMin: Math.round(seg / 60),
    };
  });
