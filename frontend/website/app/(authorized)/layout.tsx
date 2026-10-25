import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/get-session";
import Navbar from "@/components/navbar";
import { AuthProvider } from "@/components/auth/AuthContext";

export const metadata: Metadata = {
  title: "Pitstop | Authorized page",
  description: "Keep your drive alive with Pitstop.",
};

export default async function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.meta.is_authenticated) {
    redirect("/login");
  }

  return (
    <>
      <AuthProvider isAuthenticated={true}>
        {/* <Navbar isAuthenticated={true} /> */}
        {children}
      </AuthProvider>
    </>
  );
}
