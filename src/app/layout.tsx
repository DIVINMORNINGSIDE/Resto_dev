import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { CookieBanner } from "@/components/legal/cookie-banner";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Mon Miam Miam · ZeDuc@Space",
    template: "%s · Mon Miam Miam",
  },
  description:
    "Commandez au restaurant ZeDuc@Space, sur place ou en livraison, et cumulez des points de fidélité.",
  icons: { icon: "/brand/emblem.png" },
};

export const viewport: Viewport = {
  themeColor: "#17110f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${anton.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
