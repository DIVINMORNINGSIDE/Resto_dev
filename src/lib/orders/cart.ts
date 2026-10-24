export type CartLine = {
  id: string;
  name: string;
  priceFcfa: number;
  imageUrl: string | null;
  quantity: number;
};

export const MAX_QUANTITY = 20;
export const MAX_LINES = 30;

export type CartAction =
  | { type: "add"; item: Omit<CartLine, "quantity"> }
  | { type: "set"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "replace"; lines: CartLine[] };

// Panier pur et testable : quantités bornées, une ligne par plat.
export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = lines.find((l) => l.id === action.item.id);
      if (existing) {
        return lines.map((l) => (l.id === action.item.id ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + 1) } : l));
      }
      if (lines.length >= MAX_LINES) return lines;
      return [...lines, { ...action.item, quantity: 1 }];
    }
    case "set": {
      const quantity = Math.min(MAX_QUANTITY, Math.floor(action.quantity));
      if (!(quantity >= 1)) return lines.filter((l) => l.id !== action.id);
      return lines.map((l) => (l.id === action.id ? { ...l, quantity } : l));
    }
    case "remove":
      return lines.filter((l) => l.id !== action.id);
    case "clear":
      return [];
    case "replace":
      return sanitizeCart(action.lines);
  }
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.priceFcfa * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

// Panier relu depuis le stockage du navigateur : on ne garde que des lignes bien formées.
export function sanitizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const out: CartLine[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const l = raw as Record<string, unknown>;
    if (
      typeof l.id === "string" &&
      typeof l.name === "string" &&
      typeof l.priceFcfa === "number" &&
      typeof l.quantity === "number" &&
      Number.isInteger(l.quantity) &&
      l.quantity >= 1 &&
      !out.some((o) => o.id === l.id)
    ) {
      out.push({
        id: l.id,
        name: l.name,
        priceFcfa: l.priceFcfa,
        imageUrl: typeof l.imageUrl === "string" ? l.imageUrl : null,
        quantity: Math.min(MAX_QUANTITY, l.quantity),
      });
    }
    if (out.length >= MAX_LINES) break;
  }
  return out;
}
