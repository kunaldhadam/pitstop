import type { Metadata } from "next";
import BuySellExperience from "@/components/buy-sell/BuySellExperience";

export const metadata: Metadata = {
  title: "Buy & Sell Cars, Bikes and Spare Parts | Pitstop",
  description:
    "Find cars, bikes and spare parts, or list your products with Pitstop.",
};

export default async function BuySellPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialSearch = Array.isArray(params.search)
    ? (params.search[0] ?? "")
    : (params.search ?? "");

  return (
    <BuySellExperience key={initialSearch} initialSearch={initialSearch} />
  );
}
