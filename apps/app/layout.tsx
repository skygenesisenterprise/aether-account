import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/context/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Aether Account",
    default: "Aether Account",
  },
  description:
    "Your cloud hub to securely manage all Aether services, profiles, and preferences in one unified dashboard. Fully open-source, fully cloud.",
  icons: {
    icon: [
      {
        url: "/enterprise-favicon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/enterprise-favicon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/enterprise-favicon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
