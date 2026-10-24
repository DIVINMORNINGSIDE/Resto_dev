import type { Metadata } from "next";
import { EditPromotionPage } from "@/features/promotions/pages";

export const metadata: Metadata = { title: "Modifier l'affiche" };

export default function Page({ params }: PageProps<"/admin/promotions/[id]">) {
  return <EditPromotionPage area="/admin" params={params} />;
}
