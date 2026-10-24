import type { Metadata } from "next";
import { StatsPage } from "@/features/stats/stats-view";

export const metadata: Metadata = { title: "Statistiques" };

export default function Page({ searchParams }: PageProps<"/gerant/statistiques">) {
  return <StatsPage area="/gerant" basePath="/gerant/statistiques" searchParams={searchParams} />;
}
