"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoCheckbox, BoField, BoNotice } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import type { BoFormState } from "@/lib/backoffice/validation";
import { deleteQuestion, saveQuestion } from "./actions";
import type { QuizQuestion } from "./queries";

const LETTERS = ["A", "B", "C", "D"];

export function QuestionForm({ base, question }: { base: string; question?: QuizQuestion }) {
  const [state, action] = useActionState<BoFormState, FormData>(saveQuestion, {});
  const [deleteState, remove] = useActionState<BoFormState, FormData>(deleteQuestion, {});
  const v = state.values;
  const e = state.errors ?? {};
  const correct = v?.correct ?? String(question?.correctIndex ?? 0);

  return (
    <div className="flex flex-col gap-6 lg:max-w-3xl">
      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-bo-line bg-bo-card p-5 animate-rise">
        <input type="hidden" name="retour" value={base} />
        {question ? <input type="hidden" name="id" value={question.id} /> : null}
        <BoField
          label="Question"
          name="question"
          defaultValue={v?.question ?? question?.question}
          error={e.question}
          placeholder="Ex. Avec quelle fleur prépare-t-on le jus de bissap ?"
          maxLength={200}
          required
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold">Réponses (coche la bonne)</legend>
          {LETTERS.map((letter, i) => (
            <div key={letter} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="correct"
                  value={i}
                  defaultChecked={correct === String(i)}
                  aria-label={`Réponse ${letter} est la bonne`}
                  className="size-4 accent-bo-accent"
                />
                {letter}
              </label>
              <input
                name={`choice${i}`}
                aria-label={`Réponse ${letter}`}
                defaultValue={v?.[`choice${i}`] ?? question?.choices[i] ?? ""}
                placeholder={i < 2 ? "Obligatoire" : "Facultative"}
                maxLength={80}
                className="min-h-11 rounded-xl border border-bo-line bg-bo-card px-3.5 text-base focus:border-bo-accent focus:outline-none"
              />
            </div>
          ))}
          {e.choices || e.correct ? <p className="text-sm text-bo-bad">{e.choices ?? e.correct}</p> : null}
        </fieldset>
        <BoCheckbox
          label="Question utilisée dans le quiz"
          name="isActive"
          defaultChecked={v ? v.isActive === "on" : (question?.isActive ?? true)}
        />
        <BoNotice message={state.message} />
        <div className="flex flex-wrap gap-2">
          <BoSubmit pendingLabel="Enregistrement…">{question ? "Enregistrer" : "Ajouter la question"}</BoSubmit>
          <Link href={base} className="deco inline-flex min-h-11 items-center rounded-sm px-5 text-bo-text2 hover:text-bo-text">
            Annuler
          </Link>
        </div>
      </form>

      {question ? (
        <form
          action={remove}
          className="flex flex-col items-start gap-3 border-t border-bo-line pt-6"
          onSubmit={(ev) => {
            if (!window.confirm("Supprimer cette question ?")) ev.preventDefault();
          }}
        >
          <input type="hidden" name="retour" value={base} />
          <input type="hidden" name="id" value={question.id} />
          <BoNotice message={deleteState.message} />
          <BoSubmit pendingLabel="Suppression…" variant="danger">
            Supprimer cette question
          </BoSubmit>
        </form>
      ) : null}
    </div>
  );
}
