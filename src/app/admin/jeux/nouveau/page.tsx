import type { Metadata } from "next";
import { NewQuestionPage } from "@/features/games/pages";

export const metadata: Metadata = { title: "Nouvelle question" };

export default function Page() {
  return <NewQuestionPage area="/admin" />;
}
