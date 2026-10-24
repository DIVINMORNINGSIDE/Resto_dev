import type { Metadata } from "next";
import { EditPromotionPage } from "@/features/promotions/pages";

export const metadata: Metadata = { title: "Modifier l'affiche" };

export default function Page({ params }: PageProps<"/gerant/promotions/[id]">) {
  return <EditPromotionPage area="/gerant" params={params} />;
}
