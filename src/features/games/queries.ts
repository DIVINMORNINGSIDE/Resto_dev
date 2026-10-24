import "server-only";
import { createClient } from "@/lib/supabase/server";

export type QuizPlay = { answerIndex: number; correctIndex: number; points: number };
export type WheelPlay = { segment: number; points: number };
export type GamesToday = {
  enabled: boolean;
  quizPoints: number;
  wheelSegments: number[];
  quiz: { id: string; question: string; choices: string[] } | null;
  quizPlay: QuizPlay | null;
  wheelPlay: WheelPlay | null;
};

// Jeux du jour de l'étudiant connecté (la bonne réponse n'arrive qu'après avoir joué).
export async function getMyGamesToday(): Promise<GamesToday> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_games_today");
  if (error || !data) throw new Error("Les jeux n'ont pas pu être chargés.");
  return data as unknown as GamesToday;
}

export type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  isActive: boolean;
};

type Row = { id: string; question: string; choices: string[]; correct_index: number; is_active: boolean };

function toQuestion(r: Row): QuizQuestion {
  return { id: r.id, question: r.question, choices: r.choices, correctIndex: r.correct_index, isActive: r.is_active };
}

const COLUMNS = "id, question, choices, correct_index, is_active";

// Questions du quiz, pour le gérant et l'admin (la RLS les cache aux autres).
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quiz_questions").select(COLUMNS).order("created_at", { ascending: false });
  if (error) throw new Error("Les questions n'ont pas pu être chargées.");
  return (data as Row[]).map(toQuestion);
}

export async function getQuizQuestion(id: string): Promise<QuizQuestion | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("quiz_questions").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? toQuestion(data as Row) : null;
}

export type GamesSummary = { players: number; quizPlays: number; quizWins: number; wheelPlays: number; points: number };

// Parties des 7 derniers jours, pour suivre l'intérêt des étudiants.
export async function getGamesSummary(): Promise<GamesSummary> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase.from("game_plays").select("user_id, game, points").gte("played_on", since);
  if (error) return { players: 0, quizPlays: 0, quizWins: 0, wheelPlays: 0, points: 0 };
  const quiz = data.filter((p) => p.game === "quiz");
  return {
    players: new Set(data.map((p) => p.user_id)).size,
    quizPlays: quiz.length,
    quizWins: quiz.filter((p) => p.points > 0).length,
    wheelPlays: data.length - quiz.length,
    points: data.reduce((sum, p) => sum + p.points, 0),
  };
}
