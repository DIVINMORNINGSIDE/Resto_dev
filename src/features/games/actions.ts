"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { fieldErrors } from "@/lib/auth/validation";
import { quizQuestionSchema, type BoFormState } from "@/lib/backoffice/validation";
import { createClient } from "@/lib/supabase/server";

const UNEXPECTED = "Ça n'a pas marché. Réessaie dans un instant.";
const BASES = ["/admin/jeux", "/gerant/jeux"] as const;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Les fonctions SQL renvoient des messages déjà rédigés pour le client.
function sqlMessage(error: { code?: string; message: string }): string {
  return ["22023", "42501", "P0002"].includes(error.code ?? "") ? error.message : UNEXPECTED;
}

export type QuizResult = { error?: string; answer?: number; correctIndex?: number; points?: number };

export async function playQuiz(_prev: QuizResult, formData: FormData): Promise<QuizResult> {
  await requireRole(PERMISSIONS.commander);
  const answer = Number(text(formData, "answer"));
  if (!text(formData, "answer") || !Number.isInteger(answer)) return { error: "Choisis une réponse." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("play_quiz", { p_question_id: text(formData, "questionId"), p_answer: answer });
  if (error || !data?.[0]) return { error: error ? sqlMessage(error) : UNEXPECTED };
  refresh();
  return { answer, correctIndex: data[0].correct_index, points: data[0].points };
}

export type SpinResult = { error?: string; segment?: number; points?: number };

// Le tirage a lieu en base ; le navigateur ne fait qu'animer la roue vers le résultat.
export async function spinWheel(): Promise<SpinResult> {
  await requireRole(PERMISSIONS.commander);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("spin_wheel");
  if (error || !data?.[0]) return { error: error ? sqlMessage(error) : UNEXPECTED };
  refresh();
  return { segment: data[0].segment, points: data[0].points };
}

function base(formData: FormData): string {
  const value = text(formData, "retour");
  return (BASES as readonly string[]).includes(value) ? value : BASES[0];
}

export async function saveQuestion(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const choices = [0, 1, 2, 3].map((i) => text(formData, `choice${i}`));
  const values = {
    question: text(formData, "question"),
    correct: text(formData, "correct"),
    isActive: text(formData, "isActive"),
    ...Object.fromEntries(choices.map((c, i) => [`choice${i}`, c])),
  };
  const parsed = quizQuestionSchema.safeParse({ ...values, choices });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const q = parsed.data;

  // Les réponses vides sont retirées ; la bonne réponse garde sa place.
  const kept = q.choices.map((c, i) => ({ c, i })).filter(({ c }) => c);
  const row = {
    question: q.question,
    choices: kept.map(({ c }) => c),
    correct_index: kept.findIndex(({ i }) => i === q.correct),
    is_active: q.isActive,
  };

  await requireRole(PERMISSIONS.jeux);
  const supabase = await createClient();
  const id = text(formData, "id");
  const { error } = id
    ? await supabase.from("quiz_questions").update(row).eq("id", id)
    : await supabase.from("quiz_questions").insert(row);
  if (error) return { message: "L'enregistrement a échoué. Réessaie dans un instant.", values };
  redirect(base(formData));
}

export async function deleteQuestion(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  await requireRole(PERMISSIONS.jeux);
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", text(formData, "id"));
  if (error) return { message: "La suppression a échoué. Réessaie dans un instant." };
  redirect(base(formData));
}
