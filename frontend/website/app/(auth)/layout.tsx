import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Pitstop | Your account",
  description: "Keep your drive alive with Pitstop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <>{children}</>;
}
