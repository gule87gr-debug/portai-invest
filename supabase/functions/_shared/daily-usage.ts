import { dailyRequirements, type Tier } from "./subscription-policy.ts";
const messages: Record<string, string> = {
  en: "You've reached today's fair-use limit. It resets at 00:00 UTC.",
  es: "Has alcanzado el límite de uso razonable de hoy. Se restablece a las 00:00 UTC.",
  fr: "Vous avez atteint la limite d'utilisation raisonnable du jour. Elle se réinitialise à 00:00 UTC.",
  de: "Du hast das heutige Fair-Use-Limit erreicht. Es wird um 00:00 UTC zurückgesetzt.",
  it: "Hai raggiunto il limite di utilizzo equo di oggi. Si ripristina alle 00:00 UTC.",
  pt: "Atingiste o limite de utilização razoável de hoje. É reposto às 00:00 UTC.",
};
export async function reserveDailyUsage(client: any, userId: string, tier: Tier, admin: boolean, action: "chat" | "analysis" | "deep_dive", images = false) {
  const requirements = dailyRequirements(tier, admin, action, images);
  if (!requirements.length) return true;
  const { data, error } = await client.rpc("reserve_daily_usage", { p_user_id: userId, p_requirements: requirements });
  if (error || typeof data !== "boolean") throw new Error("Could not verify daily usage");
  return data;
}
export function dailyLimitResponse(tier: Tier, language: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ code: tier === "pro" ? "FAIR_USE_LIMIT" : "DAILY_LIMIT", error: tier === "pro" ? messages[language] ?? messages.en : "Daily limit reached. It resets at 00:00 UTC. Upgrade to Pro for more." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}