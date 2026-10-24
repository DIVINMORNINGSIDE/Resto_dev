import type { Metadata } from "next";
import { PromotionsPage } from "@/features/promotions/pages";

export const metadata: Metadata = { title: "Promotions" };

export default function Page() {
  return <PromotionsPage area="/admin" />;
}
