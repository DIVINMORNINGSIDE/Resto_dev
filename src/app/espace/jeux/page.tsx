import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyGamesToday } from "@/features/games/queries";
import { QuizCard } from "@/features/games/quiz-card";
import { Wheel } from "@/features/games/wheel";
import { StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Jeux du jour" };

export default function GamesPage() {
  return (
    <>
      <StudentHeader kicker="Gagne des points" title="Jeux du jour" />
      <Suspense fallback={<GamesSkeleton />}>
        <Games />
      </Suspense>
    </>
  );
}

async function Games() {
  const profile = await requireRole(allowedRolesFor("/espace"));
  const games = await getMyGamesToday();

  if (!games.enabled) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed border-line p-6 lg:max-w-3xl">
        <p className="text-mute">Les jeux sont en pause pour le moment. Reviens bientôt !</p>
        <Link href="/espace" className="deco text-accent underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-mute">
        Un quiz et un tour de roue par jour. Les points gagnés s&apos;ajoutent à ta carte : tu en as{" "}
        <Link href="/espace/fidelite" className="font-semibold text-cream underline hover:text-accent">
          {profile.pointsBalance}
        </Link>
        .
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="quiz" className="flex flex-col gap-4 border border-cream/15 bg-s1 p-5 animate-rise">
          <h2 id="quiz" className="deco text-accent">
            Quiz du jour
          </h2>
          {games.quiz ? (
            <QuizCard quiz={games.quiz} play={games.quizPlay} reward={games.quizPoints} />
          ) : (
            <p className="text-mute">Pas de question aujourd&apos;hui. Tente ta chance à la roue !</p>
          )}
        </section>
        <section
          aria-labelledby="roue"
          className="flex flex-col gap-4 border border-cream/15 bg-s1 p-5 animate-rise"
          style={{ animationDelay: "80ms" }}
        >
          <h2 id="roue" className="deco text-accent">
            Roue de la chance
          </h2>
          <Wheel segments={games.wheelSegments} play={games.wheelPlay} />
        </section>
      </div>
    </div>
  );
}

function GamesSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement des jeux">
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
