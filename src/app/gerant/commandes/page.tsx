import type { Metadata } from "next";
import { KitchenPage } from "@/features/orders/kitchen";

export const metadata: Metadata = { title: "Commandes" };

export default function Page() {
  return <KitchenPage area="/gerant" title="Supervision des commandes" />;
}
