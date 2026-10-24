import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoCard, BoPageHeader } from "@/components/backoffice/bo-form";
import { StatCard } from "@/components/backoffice/backoffice-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { QuestionForm } from "./question-form";
import { getGamesSummary, getQuizQuestion, getQuizQuestions } from "./queries";

// Pages des mini-jeux partagées par l'administration et l'espace gérant.
type Area = "/admin" | "/gerant";

export function GamesAdminPage({ area }: { area: Area }) {
  const base = `${area}/jeux`;
  return (
    <>
      <BoPageHeader kicker="Fidélité" title="Mini-jeux">
        <Link
          href={`${base}/nouveau`}
          className="deco inline-flex min-h-11 items-center rounded-sm bg-bo-text px-5 text-bo-bg transition hover:bg-bo-text/85"
        >
          Nouvelle question
        </Link>
      </BoPageHeader>
      <Suspense fallback={<ListSkeleton />}>
        <GamesAdmin area={area} base={base} />
      </Suspense>
    </>
  );
}

async function GamesAdmin({ area, base }: { area: Area; base: string }) {
  await requireRole(PERMISSIONS.jeux);
  const [questions, summary] = await Promise.all([getQuizQuestions(), getGamesSummary()]);
  const active = questions.filter((q) => q.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Joueurs (7 jours)" value={summary.players} tone="info" />
        <StatCard label="Quiz réussis" value={`${summary.quizWins} / ${summary.quizPlays}`} tone="ok" />
        <StatCard label="Tours de roue" value={summary.wheelPlays} />
        <StatCard label="Points distribués" value={summary.points} tone="warn" />
      </div>
      <p className="text-sm text-bo-text2">
        {active} question{active > 1 ? "s" : ""} en jeu : chaque étudiant reçoit l&apos;une d&apos;elles par jour. Les points
        et l&apos;ouverture des jeux se règlent dans{" "}
        <Link href={`${area}/parametres`} className="font-semibold text-bo-accent underline">
          Paramètres
        </Link>
        .
      </p>
      {questions.length ? (
        <ul className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <li key={q.id} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
              <Link
                href={`${base}/${q.id}`}
                aria-label={`Modifier la question ${q.question}`}
                className="flex flex-col gap-2 rounded-2xl border border-bo-line bg-bo-card p-4 transition hover:border-bo-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{q.question}</span>
                  <span className="block text-sm text-bo-text2">Réponse : {q.choices[q.correctIndex]}</span>
                </span>
                <span
                  className={`deco self-start rounded-full px-2 py-0.5 text-[10px] sm:self-center ${
                    q.isActive ? "bg-bo-okbg text-bo-ok" : "bg-bo-warnbg text-bo-warn"
                  }`}
                >
                  {q.isActive ? "En jeu" : "Retirée"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <BoCard>
          <p className="text-bo-text2">
            Aucune question. Ajoute-en quelques-unes sur la cuisine, le restaurant ou le campus : le quiz du jour
            apparaîtra dans l&apos;espace étudiant.
          </p>
        </BoCard>
      )}
    </div>
  );
}

export function NewQuestionPage({ area }: { area: Area }) {
  return (
    <>
      <BoPageHeader kicker="Mini-jeux" title="Nouvelle question" />
      <Suspense fallback={<FormSkeleton />}>
        <NewQuestion base={`${area}/jeux`} />
      </Suspense>
    </>
  );
}

async function NewQuestion({ base }: { base: string }) {
  await requireRole(PERMISSIONS.jeux);
  return <QuestionForm base={base} />;
}

export function EditQuestionPage({ area, params }: { area: Area; params: Promise<{ id: string }> }) {
  return (
    <>
      <BoPageHeader kicker="Mini-jeux" title="Modifier la question" />
      <Suspense fallback={<FormSkeleton />}>
        <EditQuestion base={`${area}/jeux`} params={params} />
      </Suspense>
    </>
  );
}

async function EditQuestion({ base, params }: { base: string; params: Promise<{ id: string }> }) {
  await requireRole(PERMISSIONS.jeux);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const question = await getQuizQuestion(id);
  if (!question) notFound();
  return <QuestionForm base={base} question={question} />;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement des mini-jeux">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} tone="light" className="h-28" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} tone="light" className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement du formulaire" className="lg:max-w-3xl">
      <Skeleton tone="light" className="h-96 w-full rounded-2xl" />
    </div>
  );
}
