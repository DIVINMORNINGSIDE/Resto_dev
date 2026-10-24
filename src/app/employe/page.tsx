import { redirect } from "next/navigation";

// L'employé n'a pas de tableau de bord : son espace s'ouvre sur les commandes.
export default function EmployeePage() {
  redirect("/employe/commandes");
}
