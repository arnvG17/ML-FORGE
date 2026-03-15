import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { forgeAppearance } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FORGE — AI Agent Workbench",
  description:
    "Describe it. Watch it build. See it run. An AI-powered code generation and execution platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      appearance={forgeAppearance}
      // @ts-ignore
      unsafe_disableDevelopmentModeWarnings={true}
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <head>
          <Script
            src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
            strategy="beforeInteractive"
          />
        </head>
        <body className="font-sans antialiased">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
