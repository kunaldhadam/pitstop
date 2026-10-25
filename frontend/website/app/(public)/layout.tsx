// app/(unauthorized)/layout.tsx
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/get-session";
import { AuthProvider } from "@/components/auth/AuthContext";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pitstop | Home",
  description: "Keep your drive alive with Pitstop.",
};

export default async function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <AuthProvider isAuthenticated={session.meta.is_authenticated}>
      <Navbar isAuthenticated={session.meta.is_authenticated} />
      {children}
      <Footer />
    </AuthProvider>
  );
}
