import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Tracker } from "@/components/site/Tracker";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "M&S Care | Acteur de la santé pour tous",
  description:
    "M&S Care est un laboratoire pharmaceutique dédié à la santé du quotidien à Madagascar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Tracker />
      </body>
    </html>
  );
}
