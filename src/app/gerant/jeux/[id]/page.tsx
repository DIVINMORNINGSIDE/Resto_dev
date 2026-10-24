import type { Metadata } from "next";
import { EditQuestionPage } from "@/features/games/pages";

export const metadata: Metadata = { title: "Modifier la question" };

export default function Page({ params }: PageProps<"/gerant/jeux/[id]">) {
  return <EditQuestionPage area="/gerant" params={params} />;
}
