export type CardStyle = "standard" | "compact" | "minimal"

/** Only the public response field controls the global card appearance. */
export function cardStyleFromConfig(value: unknown): CardStyle {
  if (!value || typeof value !== "object" || !("cardStyle" in value)) return "standard"
  return value.cardStyle === "compact" || value.cardStyle === "minimal" ? value.cardStyle : "standard"
}

export function cardGridClass(style: CardStyle): string {
  if (style === "compact") return "grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
  if (style === "minimal") return "grid grid-cols-1 items-start gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
  return "grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
}
