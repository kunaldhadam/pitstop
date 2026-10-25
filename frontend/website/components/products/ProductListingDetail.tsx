"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  productApiBaseUrl,
  requestProductApi,
  type ProductListing,
} from "@/lib/product-listings";
import styles from "./ProductListingDetail.module.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProductListing(value: unknown): value is ProductListing {
  if (!isRecord(value) || !isRecord(value.seller)) return false;

  return (
    typeof value.id === "number" &&
    (value.listing_type === "car" ||
      value.listing_type === "bike" ||
      value.listing_type === "spare_part") &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "string" &&
    typeof value.currency === "string" &&
    typeof value.is_price_negotiable === "boolean" &&
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
    typeof value.moderation_note === "string" &&
    typeof value.created_at === "string" &&
    typeof value.seller.name === "string" &&
    (typeof value.seller.account_type === "string" ||
      value.seller.account_type === null) &&
    typeof value.seller.email === "string" &&
    (typeof value.seller.phone_number === "string" ||
      value.seller.phone_number === null) &&
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

function assetUrl(path: string) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${productApiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrice(listing: ProductListing) {
  const price = Number(listing.price);
  return `${listing.currency} ${price.toLocaleString("en-US", {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function ProductIcon({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <Image
      className={styles.specIcon}
      src={src}
      alt={alt}
      width={16}
      height={16}
      aria-hidden={alt === "" ? true : undefined}
    />
  );
}

export default function ProductListingDetail({
  listingId,
}: {
  listingId: string;
}) {
  const [listing, setListing] = useState<ProductListing | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarListings, setSimilarListings] = useState<ProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [similarListingsError, setSimilarListingsError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [savedSimilarIds, setSavedSimilarIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanTerm, setLoanTerm] = useState("60");
  const [interestRate, setInterestRate] = useState("4");

  useEffect(() => {
    const controller = new AbortController();

    if (!/^\d+$/.test(listingId) || Number(listingId) < 1) {
      return () => controller.abort();
    }

    requestProductApi(`/api/products/listings/${listingId}/`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: unknown) => {
        if (controller.signal.aborted) return;
        if (!isProductListing(data) || data.status !== "active") {
          throw new Error("This listing is no longer available.");
        }

        setListing(data);
        setSelectedImage(0);

        return requestProductApi(
          `/api/products/listings/?listing_type=${data.listing_type}`,
          { signal: controller.signal },
        )
          .then((response) => response.json())
          .then((similarData: unknown) => {
            if (controller.signal.aborted) return;
            if (
              !Array.isArray(similarData) ||
              !similarData.every(isProductListing)
            ) {
              throw new Error(
                "Similar listings could not be read due to an unexpected response.",
              );
            }
            setSimilarListings(
              similarData.filter((item) => item.id !== data.id).slice(0, 3),
            );
          })
          .catch((similarError: unknown) => {
            if (controller.signal.aborted) return;
            setSimilarListingsError(
              similarError instanceof Error
                ? similarError.message
                : "Similar listings are unavailable right now.",
            );
          });
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "We couldn’t load this listing.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [listingId]);

  if (!/^\d+$/.test(listingId) || Number(listingId) < 1) {
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <h1>Listing unavailable</h1>
          <p>This listing could not be found.</p>
          <Link href="/buy-sell">Back to Buy &amp; Sell</Link>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p className={styles.state} role="status">
          Loading listing...
        </p>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <h1>Listing unavailable</h1>
          <p>{error || "This listing could not be found."}</p>
          <Link href="/buy-sell">Back to Buy &amp; Sell</Link>
        </div>
      </main>
    );
  }

  const isPart = listing.listing_type === "spare_part";
  const selectedImageFile = listing.image_files[selectedImage];
  const secondaryImage = listing.image_files.find(
    (_, index) => index !== selectedImage,
  );
  const phoneNumber = (listing.seller.phone_number ?? "").replace(
    /[^\d+]/g,
    "",
  );
  const whatsappNumber = (listing.seller.phone_number ?? "").replace(/\D/g, "");
  const mileage =
    listing.mileage_km === null
      ? "Not specified"
      : `${listing.mileage_km.toLocaleString("en-US")} km`;
  const features = [
    ...listing.features,
    ...(listing.fuel_type ? [humanize(listing.fuel_type)] : []),
    ...(listing.transmission ? [humanize(listing.transmission)] : []),
    ...(listing.has_service_history ? ["Service history"] : []),
    ...(listing.color ? [`${humanize(listing.color)} exterior`] : []),
  ].filter((feature, index, all) => {
    const normalized = feature.toLowerCase();
    return (
      all.findIndex((candidate) => candidate.toLowerCase() === normalized) ===
      index
    );
  });
  const featureItems = features.length
    ? features
    : [
        humanize(listing.condition),
        listing.brand || listing.make,
        listing.part_category || listing.model_name,
      ].filter(Boolean);
  const overviewItems = isPart
    ? [
        ["Part name", listing.part_name, "/buy-sell/filter-model.svg"],
        ["Part number", listing.oem_part_number, "/buy-sell/filter-model.svg"],
        [
          "Condition",
          humanize(listing.condition),
          "/buy-sell/filter-badge.svg",
        ],
        ["Brand", listing.brand, "/buy-sell/filter-model.svg"],
        [
          "Quantity",
          listing.quantity_available?.toLocaleString("en-US") ?? "",
          "/buy-sell/filter-owner.svg",
        ],
        ["Category", listing.part_category, "/buy-sell/filter-features.svg"],
      ]
    : [
        [
          "Model / Make",
          [listing.model_name, listing.make].filter(Boolean).join(" / "),
          "/buy-sell/filter-model.svg",
        ],
        ["Fuel", humanize(listing.fuel_type), "/buy-sell/listing-fuel.svg"],
        ["Mileage", mileage, "/buy-sell/listing-mileage.svg"],
        ["Colour", listing.color, "/buy-sell/filter-colour.svg"],
        [
          "Transmission",
          humanize(listing.transmission),
          "/buy-sell/listing-transmission.svg",
        ],
        [
          "Previous owners",
          listing.previous_owners?.toString() ?? "",
          "/buy-sell/filter-owner.svg",
        ],
      ];
  const monthlyRate = (Number(interestRate) || 0) / 1200;
  const numberOfPayments = Number(loanTerm) || 0;
  const monthlyPayment =
    Number(loanAmount) > 0 && numberOfPayments > 0
      ? monthlyRate > 0
        ? (Number(loanAmount) *
            monthlyRate *
            (1 + monthlyRate) ** numberOfPayments) /
          ((1 + monthlyRate) ** numberOfPayments - 1)
        : Number(loanAmount) / numberOfPayments
      : 0;

  function scrollToDealer() {
    document
      .getElementById("listing-dealer")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function shareListing(title: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        setShareFeedback("");
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback("Listing link copied.");
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }
      setShareFeedback(
        shareError instanceof Error
          ? `Unable to share this listing: ${shareError.message}`
          : "Unable to share this listing right now.",
      );
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.searchRow}>
        <div className={styles.searchInner}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">&gt;</span>
            <Link href="/buy-sell">Buy/Sell</Link>
            <span aria-hidden="true">&gt;</span>
            <span aria-current="page">View Details</span>
          </nav>
          {/* <form className={styles.searchForm} action="/buy-sell" method="get">
            <input
              type="search"
              name="search"
              placeholder="Search"
              aria-label="Search Buy & Sell listings"
            />
            <button type="submit" aria-label="Search listings">
              <span className={styles.searchIcon} aria-hidden="true" />
            </button>
          </form> */}
        </div>
      </div>
      <div className={styles.content}>
        <header className={styles.heading}>
          <span className={styles.vehicleMark} aria-hidden="true">
            <Image src="/icons/sidebar/Car.svg" alt="" width={24} height={24} />
          </span>
          <div className={styles.headingText}>
            <h1>{listing.title}</h1>
            <span>
              {[listing.make, listing.model_name].filter(Boolean).join(" ")}
            </span>
          </div>
          <span className={styles.emiLabel}>EMI Calculator</span>
          <button
            className={styles.shareButton}
            type="button"
            aria-label="Share listing"
            onClick={() => void shareListing(listing.title)}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="19.5" stroke="#F4B520" />
              <path
                d="M15.2 17.9 20.7 14.4M15.2 21.1l5.5 3.5"
                stroke="rgba(0, 0, 0, 0.5)"
                strokeWidth="1.7"
              />
              <circle cx="13.35" cy="19.5" r="3.35" fill="#808080" />
              <circle cx="23.65" cy="13.17" r="3.35" fill="#808080" />
              <circle cx="23.65" cy="25.83" r="3.35" fill="#808080" />
            </svg>
          </button>
          <span
            className={styles.shareFeedback}
            role="status"
            aria-live="polite"
          >
            {shareFeedback}
          </span>
        </header>

        <section className={styles.hero} aria-label="Listing photos">
          <div className={styles.gallery}>
            {selectedImageFile ? (
              <button
                className={`${styles.photo} ${styles.primaryPhoto}`}
                type="button"
                aria-label={`Show photo ${selectedImage + 1}`}
                onClick={() =>
                  setSelectedImage(
                    (current) => (current + 1) % listing.image_files.length,
                  )
                }
              >
                <Image
                  fill
                  src={assetUrl(selectedImageFile.image)}
                  alt={selectedImageFile.alt_text || listing.title}
                  sizes="(max-width: 680px) 100vw, 60vw"
                  priority
                  loading="eager"
                  unoptimized
                />
              </button>
            ) : (
              <div className={`${styles.photo} ${styles.photoPlaceholder}`}>
                <span>{isPart ? listing.part_category : listing.make}</span>
                <strong>
                  {isPart ? listing.part_name : listing.model_name}
                </strong>
              </div>
            )}
            {secondaryImage ? (
              <button
                className={`${styles.photo} ${styles.secondaryPhoto}`}
                type="button"
                aria-label={`Show photo ${listing.image_files.indexOf(secondaryImage) + 1}`}
                onClick={() =>
                  setSelectedImage(listing.image_files.indexOf(secondaryImage))
                }
              >
                <Image
                  fill
                  src={assetUrl(secondaryImage.image)}
                  alt={
                    secondaryImage.alt_text ||
                    `${listing.title}, alternate view`
                  }
                  sizes="(max-width: 680px) 100vw, 40vw"
                  priority
                  loading="eager"
                  unoptimized
                />
                {listing.image_files.length > 2 && (
                  <span className={styles.photoCount}>
                    +{listing.image_files.length - 2} photos
                  </span>
                )}
              </button>
            ) : (
              <div
                className={`${styles.photo} ${styles.photoPlaceholder} ${styles.secondaryPlaceholder}`}
              >
                {listing.image_files.length > 0 ? (
                  <span>No additional photos</span>
                ) : (
                  <span>No photo available</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.listingMeta}>
            <div className={styles.metaTitle}>
              <h2>{listing.title}</h2>
              <p>{listing.location}</p>
            </div>
            <div className={styles.metaDetails}>
              {!isPart && listing.year !== null && (
                <span className={styles.metaYear}>Year - {listing.year}</span>
              )}
              {isPart && (
                <span className={styles.metaYear}>
                  {listing.brand || humanize(listing.part_category)}
                </span>
              )}
              <strong className={styles.metaPrice}>
                {formatPrice(listing)}
              </strong>
              {listing.is_price_negotiable && (
                <span className={styles.negotiable}>Negotiable</span>
              )}
              {!isPart && listing.transmission && (
                <span className={styles.metaDrive}>
                  {humanize(listing.transmission)}
                </span>
              )}
            </div>
          </div>

          <details className={styles.emi}>
            <summary>
              <span>
                Easily calculate your monthly payments and plan your budget
                smarter.
              </span>
              <span className={styles.emiArrow} aria-hidden="true">
                ›
              </span>
            </summary>
            <div className={styles.emiFields}>
              <label>
                Loan amount ({listing.currency})
                <input
                  type="number"
                  min="0"
                  max={Number(listing.price)}
                  value={loanAmount}
                  onChange={(event) => setLoanAmount(event.target.value)}
                  placeholder={listing.price}
                />
              </label>
              <label>
                Term
                <select
                  value={loanTerm}
                  onChange={(event) => setLoanTerm(event.target.value)}
                >
                  {[12, 24, 36, 48, 60, 72].map((months) => (
                    <option key={months} value={months}>
                      {months} months
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Interest (% p.a.)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                />
              </label>
              {monthlyPayment > 0 && (
                <p aria-live="polite">
                  Estimated monthly payment:{" "}
                  <strong>
                    {listing.currency}{" "}
                    {monthlyPayment.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </p>
              )}
            </div>
          </details>
        </section>

        <section className={styles.featurePanel}>
          <h2 className={styles.sectionTitle}>Features &amp; Specs</h2>
          <div className={styles.featureGrid}>
            {featureItems.map((feature, index) => (
              <div className={styles.feature} key={`${feature}-${index}`}>
                <span className={styles.featureCheck} aria-hidden="true">
                  ✓
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.informationGrid}>
          <section className={styles.overviewPanel}>
            <h2 className={styles.sectionTitle}>
              {isPart ? "Part Overview" : "Car Overview"}
            </h2>
            <div className={styles.overviewGrid}>
              {overviewItems.map(([label, value, icon]) => (
                <div className={styles.overviewItem} key={label}>
                  <ProductIcon src={icon} />
                  <span>{value || label}</span>
                </div>
              ))}
            </div>
          </section>

          <section
            className={styles.dealerPanel}
            id="listing-dealer"
            aria-labelledby="listing-dealer-title"
          >
            <h2 className={styles.sectionTitle} id="listing-dealer-title">
              Dealer Details
            </h2>
            <div className={styles.dealerIdentity}>
              <div>
                <Image
                  src="/buy-sell/DealerDetailsicon.png"
                  alt={listing.seller.name}
                  width={158}
                  height={110}
                />
              </div>
              <div className={styles.dealerName}>
                <strong>{listing.seller.name}</strong>
                <span>{listing.location}</span>
                {listing.seller.account_type && (
                  <span>{humanize(listing.seller.account_type)}</span>
                )}
              </div>
            </div>
            <p
              className={styles.dealerLocation}
              style={{ display: "flex", alignItems: "center" }}
            >
              <span
                aria-hidden="true"
                style={{ display: "inline-block", marginRight: "10px" }}
              >
                <svg
                  width="14"
                  height="18"
                  viewBox="0 0 14 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 0C3.13556 0 0 2.59192 0 5.78571C0 10.9286 7 18 7 18C7 18 14 10.9286 14 5.78571C14 2.59192 10.8644 0 7 0ZM7 9C6.44621 9 5.90486 8.84919 5.4444 8.56664C4.98395 8.28408 4.62506 7.88248 4.41314 7.41261C4.20121 6.94275 4.14576 6.42572 4.2538 5.92691C4.36184 5.4281 4.62851 4.96992 5.0201 4.6103C5.41169 4.25068 5.9106 4.00577 6.45375 3.90655C6.99689 3.80733 7.55988 3.85826 8.07151 4.05288C8.58315 4.24751 9.02045 4.57709 9.32811 4.99996C9.63578 5.42283 9.8 5.91999 9.8 6.42857C9.79919 7.11033 9.50393 7.76395 8.979 8.24602C8.45408 8.7281 7.74236 8.99926 7 9Z"
                    fill="#F4B520"
                  ></path>
                </svg>
              </span>
              {listing.location}
            </p>
            <div className={styles.contactActions}>
              {phoneNumber && (
                <a className={styles.callButton} href={`tel:${phoneNumber}`}>
                  <Image
                    src="/buy-sell/detail-call.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                  Call
                </a>
              )}
              {whatsappNumber && (
                <a
                  className={styles.whatsappButton}
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hello, I’m interested in ${listing.title}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src="/buy-sell/detail-whatsapp.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                  WhatsApp
                </a>
              )}
              {!phoneNumber && !whatsappNumber && listing.seller.email && (
                <a
                  className={styles.callButton}
                  href={`mailto:${listing.seller.email}?subject=${encodeURIComponent(
                    `Question about ${listing.title}`,
                  )}`}
                >
                  Email Seller
                </a>
              )}
              {!phoneNumber && !whatsappNumber && !listing.seller.email && (
                <p className={styles.noContact}>
                  Seller contact details are unavailable.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.policyGrid}>
          <section className={styles.inspectionPanel}>
            <h2 className={styles.sectionTitle}>Inspection Report</h2>
            <div>
              <p>
                {isPart
                  ? "This part is not inspected by Pitstop."
                  : "This vehicle is not inspected by Pitstop."}
              </p>
              <span>
                {isPart
                  ? "Contact the seller to confirm part condition."
                  : "Request an inspection report from Pitstop"}
              </span>
            </div>
            <button type="button" onClick={scrollToDealer}>
              Request Inspection
            </button>
          </section>

          <section className={styles.agreementPanel}>
            <h2 className={styles.sectionTitle}>Policies and Agreement</h2>
            <p>
              {listing.warranty_details ||
                listing.return_policy ||
                "I hereby agree to the terms and conditions of the sale agreement with the seller"}
            </p>
            <button
              type="button"
              aria-expanded={isPolicyExpanded}
              onClick={() => setIsPolicyExpanded((current) => !current)}
            >
              {isPolicyExpanded ? "Hide Details" : "View Details"}
            </button>
            {isPolicyExpanded && (
              <div className={styles.agreementDetails}>
                {listing.warranty_details && (
                  <p>
                    <strong>Warranty:</strong> {listing.warranty_details}
                  </p>
                )}
                {listing.return_policy && (
                  <p>
                    <strong>Returns:</strong> {listing.return_policy}
                  </p>
                )}
                {!listing.warranty_details && !listing.return_policy && (
                  <p>
                    Confirm sale, inspection, payment, and transfer terms
                    directly with the seller.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <section className={styles.descriptionPanel}>
          <h2 className={styles.sectionTitle}>Description &amp; Highlights</h2>
          <p>{listing.description}</p>
          {isPart && listing.compatible_vehicles.length > 0 && (
            <div className={styles.compatible}>
              <h3>Compatible vehicles</h3>
              <ul>
                {listing.compatible_vehicles.map((vehicle, index) => (
                  <li key={`${vehicle.make}-${vehicle.model}-${index}`}>
                    {vehicle.make} {vehicle.model} ({vehicle.year_from}–
                    {vehicle.year_to})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {listing.video && (
            <video
              className={styles.video}
              src={assetUrl(listing.video)}
              controls
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          )}
        </section>

        <section className={styles.similarSection}>
          <div className={styles.similarHeading}>
            <h2>Similar Listings</h2>
            <Link href="/buy-sell">
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
          {similarListingsError ? (
            <p className={styles.listingMessage} role="status">
              {similarListingsError}
            </p>
          ) : (
            <div className={styles.similarGrid}>
              {similarListings.map((similar) => {
                const image = similar.image_files[0];
                return (
                  <article className={styles.similarCard} key={similar.id}>
                    <Link
                      className={styles.similarImage}
                      href={`/buy-sell/listings/${similar.id}`}
                      aria-label={`View ${similar.title}`}
                    >
                      {image ? (
                        <Image
                          fill
                          src={assetUrl(image.image)}
                          alt={image.alt_text || similar.title}
                          sizes="(max-width: 680px) 50vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <span>{similar.title}</span>
                      )}
                    </Link>
                    <button
                      className={`${styles.cardHeart}${savedSimilarIds.has(similar.id) ? ` ${styles.cardSaved}` : ""}`}
                      type="button"
                      aria-label={`Save ${similar.title}`}
                      aria-pressed={savedSimilarIds.has(similar.id)}
                      onClick={() =>
                        setSavedSimilarIds((current) => {
                          const updated = new Set(current);
                          if (updated.has(similar.id))
                            updated.delete(similar.id);
                          else updated.add(similar.id);
                          return updated;
                        })
                      }
                    >
                      <Image
                        src="/buy-sell/detail-card-heart.svg"
                        alt=""
                        width={24}
                        height={24}
                      />
                    </button>
                    <div className={styles.similarContent}>
                      <h3>{similar.title}</h3>
                      <div className={styles.cardTags}>
                        {similar.year && <span>{similar.year}</span>}
                        {similar.mileage_km !== null && (
                          <span>
                            {similar.mileage_km.toLocaleString("en-US")} km
                          </span>
                        )}
                        {similar.fuel_type && (
                          <span>{humanize(similar.fuel_type)}</span>
                        )}
                      </div>
                      <div className={styles.cardFooter}>
                        <strong>{formatPrice(similar)}</strong>
                        <Link href={`/buy-sell/listings/${similar.id}`}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
              <Link
                className={styles.allListingsCard}
                href="/buy-sell"
                aria-label="Explore more listings"
              />
            </div>
          )}
        </section>

        <div className={styles.bottomBanner} aria-hidden="true" />
      </div>
    </main>
  );
}
