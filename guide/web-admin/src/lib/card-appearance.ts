import { api } from "./api.ts"
export type CardStyle = "standard" | "compact" | "minimal"
export const CARD_STYLES = [{value:"standard",label:"标准卡片"},{value:"compact",label:"小卡片"},{value:"minimal",label:"极简卡片"}] as const
export function cardStyle(value: unknown): CardStyle { return value === "compact" || value === "minimal" ? value : "standard" }
export async function loadCardStyle(): Promise<CardStyle> {
  const settings = await api<{service_card_style?:unknown}>("/settings")
  return cardStyle(settings.service_card_style)
}
export async function saveCardStyle(style: CardStyle): Promise<void> {
  if (cardStyle(style) !== style) throw new Error("卡片样式无效")
  await api("/settings",{method:"PUT",body:JSON.stringify({service_card_style:style})})
  refreshNavigation()
}
/** The koi pond behind the public page: on unless switched off. */
export function backgroundPond(value: unknown): boolean { return value !== "off" }
export async function loadAppearance(): Promise<{style: CardStyle; pond: boolean}> {
  const settings = await api<{service_card_style?:unknown; background_pond?:unknown}>("/settings")
  return {style:cardStyle(settings.service_card_style),pond:backgroundPond(settings.background_pond)}
}
export async function saveBackgroundPond(on: boolean): Promise<void> {
  await api("/settings",{method:"PUT",body:JSON.stringify({background_pond:on?"on":"off"})})
  refreshNavigation()
}
function refreshNavigation() {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("navigation-appearance")
    channel.postMessage({type:"refresh"})
    channel.close()
  }
}
