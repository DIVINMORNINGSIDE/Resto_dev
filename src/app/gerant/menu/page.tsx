import type { Metadata } from "next";
import { MenuPage } from "@/features/menu/pages";

export const metadata: Metadata = { title: "Menu" };

export default function Page() {
  return <MenuPage area="/gerant" />;
}
