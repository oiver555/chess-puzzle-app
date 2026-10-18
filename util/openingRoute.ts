import { Opening, openings } from "@/data/openings";

// ECO codes are unique in the bundled catalog. Progress continues using names.
export function resolveOpeningRoute(params: { openingId?: unknown; opening?: unknown }): Opening | null {
  if (params.openingId !== undefined) {
    if (params.opening !== undefined || typeof params.openingId !== "string") return null;
    return openings.find(opening => opening.eco === params.openingId) ?? null;
  }
  // Older routes carried the whole lesson. Only its identity is considered.
  if (typeof params.opening !== "string" || params.opening.length > 50000) return null;
  try {
    const value: unknown = JSON.parse(params.opening);
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        !("name" in value) || typeof value.name !== "string") return null;
    const opening = openings.find(opening => opening.name === value.name);
    if (!opening || ("eco" in value && value.eco !== opening.eco)) return null;
    return opening;
  } catch {
    return null;
  }
}

export function validMasteryPercent(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
}
