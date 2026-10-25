import type { Metadata } from "next";
import ProductListingDetail from "@/components/products/ProductListingDetail";

export const metadata: Metadata = {
  title: "Listing Details | Pitstop",
  description: "View listing details and contact the seller on Pitstop.",
};

export default async function ProductListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductListingDetail key={id} listingId={id} />;
}
