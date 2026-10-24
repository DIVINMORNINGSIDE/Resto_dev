import type { Metadata } from "next";
import { SettingsPage } from "@/features/settings/pages";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return <SettingsPage />;
}
