import '../lib/polyfills';
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DevReloadGuard } from "@/components/DevReloadGuard";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-jetbrains",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Azabu | Alternative Futures Exchange",
  description: "AFX -- Alternative Futures Exchange. 275+ leveraged markets across crypto, stocks, commodities, and indices.",
  icons: {
    icon: "/favicon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable} ${outfit.variable} ${dmSerif.variable}`} suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <DevReloadGuard />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
