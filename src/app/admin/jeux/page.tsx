import type { Metadata } from "next";
import { GamesAdminPage } from "@/features/games/pages";

export const metadata: Metadata = { title: "Mini-jeux" };

export default function Page() {
  return <GamesAdminPage area="/admin" />;
}
