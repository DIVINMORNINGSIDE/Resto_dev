import type { Metadata } from "next";
import { NewPromotionPage } from "@/features/promotions/pages";

export const metadata: Metadata = { title: "Nouvelle affiche" };

export default function Page() {
  return <NewPromotionPage area="/gerant" />;
}
