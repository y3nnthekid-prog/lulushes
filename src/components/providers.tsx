"use client";

import { ThemeProvider } from "next-themes";

import { ProgressProvider } from "@/lib/progress";

export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  /** Diteruskan ke skrip tema inline next-themes agar lolos CSP berbasis nonce. */
  nonce?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <ProgressProvider>{children}</ProgressProvider>
    </ThemeProvider>
  );
}
