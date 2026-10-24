import type { Metadata } from "next";
import { StaffPage } from "@/features/staff/pages";

export const metadata: Metadata = { title: "Personnel" };

export default function Page() {
  return <StaffPage />;
}
