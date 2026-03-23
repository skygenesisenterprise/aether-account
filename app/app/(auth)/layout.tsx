import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - Aether Account",
    default: "Aether Account | Your Cloud Hub for Aether Services",
  },
  description:
    "Aether Account - Your cloud hub to securely manage all Aether services, profiles, and preferences in one unified dashboard. Fully open-source, fully cloud.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  );
}
