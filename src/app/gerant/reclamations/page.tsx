import type { Metadata } from "next";
import { ComplaintsPage } from "@/features/complaints/board";

export const metadata: Metadata = { title: "Réclamations" };

export default function Page() {
  return <ComplaintsPage area="/gerant" />;
}
