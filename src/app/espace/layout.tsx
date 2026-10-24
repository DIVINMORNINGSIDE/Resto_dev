import { CartProvider } from "@/features/cart/cart-provider";
import { StudentNav } from "@/features/student/student-nav";
import { Logo } from "@/components/ui/logo";

export default function StudentLayout({ children }: LayoutProps<"/espace">) {
  return (
    <CartProvider>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4">
          <Logo subtitle="Espace étudiant" />
        </header>
        <main className="flex flex-1 flex-col px-4 pb-28">{children}</main>
        <StudentNav />
      </div>
    </CartProvider>
  );
}
