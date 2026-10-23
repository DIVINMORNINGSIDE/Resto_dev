const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

// 3500 -> "3 500 F"
export function formatFcfa(amount: number): string {
  return `${fcfa.format(amount).replace(/ | /g, " ")} F`;
}
