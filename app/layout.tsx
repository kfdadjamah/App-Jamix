import type { Metadata } from "next";
import { Figtree, Geist, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Police Harbor : Figtree (style Refero), les rôles passent par la graisse et la taille.
// Exception : la carte d'annonce reprend Plus Jakarta Sans (nom du bar) et Geist (données).
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["800"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Jammix",
  description: "Les jams à Lyon, ce soir.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : certaines extensions du navigateur ajoutent des attributs
    // à <html> avant l'hydratation ; ne masque que les écarts d'attributs de cette balise.
    <html lang="fr" className={`${figtree.variable} ${jakarta.variable} ${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
