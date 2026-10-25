"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductListingForm from "@/components/products/ProductListingForm";
import {
  productApiBaseUrl,
  requestProductApi,
  type ProductListing,
} from "@/lib/product-listings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProductListing(value: unknown): value is ProductListing {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    (value.listing_type === "car" ||
      value.listing_type === "bike" ||
      value.listing_type === "spare_part") &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "string" &&
    typeof value.currency === "string" &&
    typeof value.location === "string" &&
    typeof value.condition === "string" &&
    typeof value.make === "string" &&
    typeof value.model_name === "string" &&
    (typeof value.year === "number" || value.year === null) &&
    (typeof value.mileage_km === "number" || value.mileage_km === null) &&
    typeof value.fuel_type === "string" &&
    typeof value.transmission === "string" &&
    typeof value.color === "string" &&
    (typeof value.previous_owners === "number" ||
      value.previous_owners === null) &&
    typeof value.has_service_history === "boolean" &&
    Array.isArray(value.features) &&
    value.features.every((feature) => typeof feature === "string") &&
    typeof value.part_category === "string" &&
    typeof value.part_subcategory === "string" &&
    typeof value.part_name === "string" &&
    typeof value.brand === "string" &&
    typeof value.oem_part_number === "string" &&
    Array.isArray(value.compatible_vehicles) &&
    value.compatible_vehicles.every(
      (vehicle) =>
        isRecord(vehicle) &&
        typeof vehicle.make === "string" &&
        typeof vehicle.model === "string" &&
        typeof vehicle.year_from === "number" &&
        typeof vehicle.year_to === "number",
    ) &&
    (typeof value.quantity_available === "number" ||
      value.quantity_available === null) &&
    typeof value.warranty_details === "string" &&
    typeof value.return_policy === "string" &&
    (typeof value.video === "string" || value.video === null) &&
    typeof value.status === "string" &&
    typeof value.is_price_negotiable === "boolean" &&
    typeof value.moderation_note === "string" &&
    typeof value.created_at === "string" &&
    isRecord(value.seller) &&
    typeof value.seller.name === "string" &&
    (typeof value.seller.account_type === "string" ||
      value.seller.account_type === null) &&
    typeof value.seller.email === "string" &&
    typeof value.seller.phone_number === "string" &&
    Array.isArray(value.image_files) &&
    value.image_files.every(
      (image) =>
        isRecord(image) &&
        typeof image.id === "number" &&
        typeof image.image === "string" &&
        typeof image.alt_text === "string",
    )
  );
}

const statusLabels: Record<string, string> = {
  pending: "Pending review",
  active: "Active",
  paused: "Paused",
  rejected: "Needs updates",
  sold: "Sold",
  expired: "Expired",
};

function listingImageUrl(path: string) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${productApiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export default function MyListings() {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [editingListing, setEditingListing] = useState<ProductListing | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [busyListingId, setBusyListingId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requestProductApi("/api/products/listings/mine/", {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: unknown) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(data) || !data.every(isProductListing)) {
          throw new Error(
            "Your listings could not be read due to an unexpected response.",
          );
        }
        setListings(data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Your listings could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount]);

  function refreshListings() {
    setLoadError("");
    setIsLoading(true);
    setReloadCount((count) => count + 1);
  }

  function handleSaved() {
    setEditingListing(null);
    setIsCreating(false);
    setFeedbackIsError(false);
    setFeedback(
      editingListing
        ? "Your listing was updated and may need review."
        : "Your listing was submitted for review.",
    );
    refreshListings();
  }

  async function performAction(
    listing: ProductListing,
    action: "pause" | "resume" | "mark_sold" | "delete",
  ) {
    const prompts: Partial<Record<typeof action, string>> = {
      mark_sold: `Mark “${listing.title}” as sold?`,
      delete: `Remove “${listing.title}” from your listings?`,
    };
    const prompt = prompts[action];
    if (prompt && !window.confirm(prompt)) return;

    setFeedback("");
    setFeedbackIsError(false);
    setBusyListingId(listing.id);
    try {
      if (action === "delete") {
        await requestProductApi(`/api/products/listings/${listing.id}/`, {
          method: "DELETE",
        });
      } else {
        await requestProductApi(
          `/api/products/listings/${listing.id}/actions/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          },
        );
      }
      setFeedback(
        action === "delete"
          ? "Listing removed."
          : action === "mark_sold"
            ? "Listing marked as sold."
            : action === "pause"
              ? "Listing paused."
              : "Listing submitted for review before it goes live again.",
      );
      refreshListings();
    } catch (error) {
      setFeedbackIsError(true);
      setFeedback(
        error instanceof Error ? error.message : "The listing action failed.",
      );
    } finally {
      setBusyListingId(null);
    }
  }

  const isShowingForm = isCreating || editingListing !== null;

  return (
    <main className="profile-menu-section product-listings-page">
      <header className="product-listings-header">
        <div>
          <p className="product-listing-eyebrow">Your seller dashboard</p>
          <h1>My Listings</h1>
          <p>Manage your products and keep buyers up to date.</p>
        </div>
        {!isShowingForm && (
          <button
            className="product-listing-button"
            type="button"
            onClick={() => {
              setFeedback("");
              setIsCreating(true);
            }}
          >
            <span aria-hidden="true">+</span> Add a listing
          </button>
        )}
      </header>

      {feedback && (
        <p
          className={`product-listing-feedback${feedbackIsError ? " is-error" : ""}`}
          role={feedbackIsError ? "alert" : "status"}
        >
          {feedback}
        </p>
      )}

      {isShowingForm && (
        <ProductListingForm
          key={editingListing?.id ?? "new"}
          listing={editingListing ?? undefined}
          onCancel={() => {
            setIsCreating(false);
            setEditingListing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {isLoading && (
        <p className="product-listing-empty" role="status">
          Loading your listings...
        </p>
      )}

      {!isLoading && loadError && (
        <div className="product-listing-empty" role="alert">
          <h2>We couldn’t load your listings</h2>
          <p>{loadError}</p>
          <button
            className="product-listing-button is-secondary"
            type="button"
            onClick={refreshListings}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !loadError && listings.length === 0 && !isShowingForm && (
        <div className="product-listing-empty">
          <span className="product-listing-empty-icon" aria-hidden="true">
            +
          </span>
          <h2>Your first listing starts here</h2>
          <p>
            Add a car, bike, or spare part and it will appear here while it is
            reviewed.
          </p>
          <button
            className="product-listing-button"
            type="button"
            onClick={() => setIsCreating(true)}
          >
            Create a listing
          </button>
          <Link href="/buy-sell">Browse the marketplace</Link>
        </div>
      )}

      {!isLoading && !loadError && listings.length > 0 && (
        <section className="product-listings-grid" aria-label="Your listings">
          {listings.map((listing) => {
            const image = listing.image_files[0];
            const isBusy = busyListingId === listing.id;
            return (
              <article className="product-owner-listing" key={listing.id}>
                <div className="product-owner-listing-image">
                  {image ? (
                    <Image
                      src={listingImageUrl(image.image)}
                      alt={image.alt_text || listing.title}
                      width={360}
                      height={210}
                      unoptimized
                    />
                  ) : (
                    <span>{listing.title}</span>
                  )}
                  <span className={`product-listing-status is-${listing.status}`}>
                    {statusLabels[listing.status] ?? listing.status}
                  </span>
                </div>
                <div className="product-owner-listing-content">
                  <div className="product-owner-listing-heading">
                    <div>
                      <p className="product-listing-eyebrow">
                        {listing.listing_type.replace("_", " ")}
                      </p>
                      <h2>{listing.title}</h2>
                    </div>
                    <strong>
                      {listing.currency}{" "}
                      {Number(listing.price).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <p className="product-owner-listing-meta">
                    {listing.location} ·{" "}
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                  {listing.moderation_note && (
                    <p className="product-listing-moderation-note">
                      Review note: {listing.moderation_note}
                    </p>
                  )}
                  <div className="product-owner-listing-actions">
                    {!["sold", "expired"].includes(listing.status) && (
                      <button
                        className="product-listing-button is-secondary"
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setFeedback("");
                          setFeedbackIsError(false);
                          setEditingListing(listing);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {listing.status === "active" && (
                      <>
                        <button
                          className="product-listing-button is-secondary"
                          type="button"
                          disabled={isBusy}
                          onClick={() => void performAction(listing, "pause")}
                        >
                          Pause
                        </button>
                        <button
                          className="product-listing-button is-secondary"
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void performAction(listing, "mark_sold")
                          }
                        >
                          Mark sold
                        </button>
                      </>
                    )}
                    {listing.status === "paused" && (
                      <>
                        <button
                          className="product-listing-button is-secondary"
                          type="button"
                          disabled={isBusy}
                          onClick={() => void performAction(listing, "resume")}
                        >
                          Resume listing
                        </button>
                        <button
                          className="product-listing-button is-secondary"
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void performAction(listing, "mark_sold")
                          }
                        >
                          Mark sold
                        </button>
                      </>
                    )}
                    <button
                      className="product-listing-button is-danger"
                      type="button"
                      disabled={isBusy}
                      onClick={() => void performAction(listing, "delete")}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
