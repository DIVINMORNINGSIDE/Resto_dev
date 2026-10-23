import type { Metadata, Viewport } from "next";
import { Josefin_Sans, Karla, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const karla = Karla({ variable: "--font-karla", subsets: ["latin"] });
const josefin = Josefin_Sans({ variable: "--font-josefin", subsets: ["latin"] });

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
  themeColor: "#0b0a08",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${karla.variable} ${josefin.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
