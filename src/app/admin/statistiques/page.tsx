import type { Metadata } from "next";
import { StatsPage } from "@/features/stats/stats-view";

export const metadata: Metadata = { title: "Statistiques" };

export default function Page({ searchParams }: PageProps<"/admin/statistiques">) {
  return <StatsPage area="/admin" basePath="/admin/statistiques" searchParams={searchParams} />;
}
