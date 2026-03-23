import type { Metadata } from "next";
import { Header } from "./_components/Header";
import { Sidebar } from "./_components/Sidebar";
// import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Aether Account | Your Cloud Hub for Aether Services",
  description:
    "Aether Account - Your cloud hub to securely manage all Aether services, profiles, and preferences in one unified dashboard. Fully open-source, fully cloud.",
};

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
  );
}
