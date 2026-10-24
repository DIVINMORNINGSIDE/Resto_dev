import type { Metadata } from "next";
import { EmployeeMenuPage } from "@/features/menu/pages";

export const metadata: Metadata = { title: "Menu du jour" };

export default function Page() {
  return <EmployeeMenuPage />;
}
