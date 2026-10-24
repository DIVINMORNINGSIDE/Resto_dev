import type { Metadata } from "next";
import { EditItemPage } from "@/features/menu/pages";

export const metadata: Metadata = { title: "Modifier le plat" };

export default function Page({ params }: PageProps<"/admin/menu/[id]">) {
  return <EditItemPage area="/admin" params={params} />;
}
