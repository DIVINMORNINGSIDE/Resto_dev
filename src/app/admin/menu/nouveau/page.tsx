import type { Metadata } from "next";
import { NewItemPage } from "@/features/menu/pages";

export const metadata: Metadata = { title: "Nouveau plat" };

export default function Page() {
  return <NewItemPage area="/admin" />;
}
