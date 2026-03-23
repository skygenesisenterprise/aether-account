import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/context/Providers";
import { DashboardLayout } from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Aether Account | Your Cloud Hub for Aether Services",
  description:
    "Aether Account - Your cloud hub to securely manage all Aether services, profiles, and preferences in one unified dashboard. Fully open-source, fully cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
