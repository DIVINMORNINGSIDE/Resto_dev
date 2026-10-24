import type { Metadata } from "next";
import { StatsPage } from "@/features/stats/stats-view";

export const metadata: Metadata = { title: "Stats de la semaine" };

export default function Page() {
  return <StatsPage area="/employe" basePath="/employe/stats" />;
}
