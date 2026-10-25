import type { Metadata } from "next";
import {
  Nunito,
  Plus_Jakarta_Sans,
  Montserrat,
  Poppins,
} from "next/font/google";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Pitstop | Homepage",
  description: "Keep your drive alive with Pitstop.",
};

export const viewport = {
  width: "1024",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"], // Specify the weights you need
  variable: "--font-nunito",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`
        ${nunito.variable}
        ${plusJakartaSans.variable}
        ${montserrat.variable}
        ${poppins.variable}
      `}
    >
      <body>{children}</body>
    </html>
  );
}
