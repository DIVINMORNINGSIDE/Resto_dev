import { CartProvider } from "@/features/cart/cart-provider";
import { StudentNav } from "@/features/student/student-nav";
import { Logo } from "@/components/ui/logo";

export default function StudentLayout({ children }: LayoutProps<"/espace">) {
  return (
    <CartProvider>
      {/* Une colonne au téléphone ; sur ordinateur, la page s'élargit et les onglets passent en haut. */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col lg:max-w-6xl">
        <header className="flex items-center justify-between px-4 py-4 lg:py-6">
          <Logo subtitle="Espace étudiant" />
          <StudentNav />
        </header>
        <main className="flex flex-1 flex-col px-4 pb-28 lg:pb-16">{children}</main>
      </div>
    </CartProvider>
  );
}
