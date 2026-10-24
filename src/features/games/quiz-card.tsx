"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { Notice, primaryButton } from "@/features/student/ui";
import { playQuiz, type QuizResult } from "./actions";
import type { QuizPlay } from "./queries";

type Props = { quiz: { id: string; question: string; choices: string[] }; play: QuizPlay | null; reward: number };

// Quiz du jour : une question, une seule réponse par jour.
export function QuizCard({ quiz, play, reward }: Props) {
  const [state, action] = useActionState<QuizResult, FormData>(playQuiz, {});
  const result =
    state.correctIndex !== undefined
      ? { answerIndex: state.answer!, correctIndex: state.correctIndex, points: state.points ?? 0 }
      : play;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="questionId" value={quiz.id} />
      <fieldset className="flex flex-col gap-3" disabled={Boolean(result)}>
        <legend className="mb-3 text-lg font-semibold leading-snug">{quiz.question}</legend>
        {quiz.choices.map((choice, i) => {
          const tone = !result
            ? "border-cream/20 hover:border-cream has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            : i === result.correctIndex
              ? "border-ok bg-ok/10"
              : i === result.answerIndex
                ? "border-bad bg-bad/10"
                : "border-cream/10 opacity-60";
          return (
            <label key={i} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-3 transition ${tone}`}>
              <input
                type="radio"
                name="answer"
                value={i}
                required
                defaultChecked={result?.answerIndex === i}
                className="size-4 accent-accent"
              />
              <span className="flex-1">{choice}</span>
              {result && i === result.correctIndex ? <span className="deco text-[10px] text-ok">Bonne réponse</span> : null}
            </label>
          );
        })}
      </fieldset>

      {result ? (
        <p role="status" className={`border px-4 py-3 text-sm ${result.points > 0 ? "border-ok/40 bg-ok/10 text-ok" : "border-cream/20 text-cream/80"}`}>
          {result.points > 0
            ? `Bravo ! +${result.points} point${result.points > 1 ? "s" : ""} sur ta carte.`
            : result.answerIndex === result.correctIndex
              ? "Bonne réponse !"
              : "Raté pour aujourd'hui. Nouvelle question demain !"}
        </p>
      ) : (
        <>
          <Notice message={state.error} />
          <AnswerButton reward={reward} />
        </>
      )}
    </form>
  );
}

function AnswerButton({ reward }: { reward: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
      {pending ? <Spinner label="Vérification de ta réponse" /> : null}
      {pending ? "Vérification…" : reward > 0 ? `Valider (+${reward} pts si juste)` : "Valider ma réponse"}
    </button>
  );
}
