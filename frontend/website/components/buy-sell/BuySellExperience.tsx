"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthContext";

type ListingType = "car" | "bike" | "spare_part";

type ProductListing = {
  id: number;
  listing_type: ListingType;
  title: string;
  price: string;
  currency: string;
  location: string;
  make: string;
  model_name: string;
  year: number | null;
  mileage_km: number | null;
  fuel_type: string;
  transmission: string;
  color: string;
  previous_owners: number | null;
  has_service_history: boolean;
  features: string[];
  condition: string;
  part_category: string;
  brand: string;
  quantity_available: number | null;
  image_files: { image: string; alt_text: string }[];
  seller: { name: string; account_type: string };
};

function isProductListing(value: unknown): value is ProductListing {
  if (typeof value !== "object" || value === null) return false;
  const listing = value as Record<string, unknown>;
  return (
    typeof listing.id === "number" &&
    (listing.listing_type === "car" ||
      listing.listing_type === "bike" ||
      listing.listing_type === "spare_part") &&
    typeof listing.title === "string" &&
    typeof listing.price === "string" &&
    typeof listing.currency === "string" &&
    typeof listing.location === "string" &&
    typeof listing.make === "string" &&
    typeof listing.model_name === "string" &&
    (typeof listing.year === "number" || listing.year === null) &&
    (typeof listing.mileage_km === "number" || listing.mileage_km === null) &&
    typeof listing.fuel_type === "string" &&
    typeof listing.transmission === "string" &&
    typeof listing.color === "string" &&
    (typeof listing.previous_owners === "number" ||
      listing.previous_owners === null) &&
    typeof listing.has_service_history === "boolean" &&
    Array.isArray(listing.features) &&
    listing.features.every((feature) => typeof feature === "string") &&
    typeof listing.condition === "string" &&
    typeof listing.part_category === "string" &&
    typeof listing.brand === "string" &&
    (typeof listing.quantity_available === "number" ||
      listing.quantity_available === null) &&
    Array.isArray(listing.image_files) &&
    listing.image_files.every(
      (image) =>
        typeof image === "object" &&
        image !== null &&
        typeof (image as Record<string, unknown>).image === "string" &&
        typeof (image as Record<string, unknown>).alt_text === "string",
    ) &&
    typeof listing.seller === "object" &&
    listing.seller !== null &&
    typeof (listing.seller as Record<string, unknown>).name === "string" &&
    (typeof (listing.seller as Record<string, unknown>).account_type ===
      "string" ||
      (listing.seller as Record<string, unknown>).account_type === null)
  );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MIN_LISTING_YEAR = 1886;
const MAX_LISTING_YEAR = new Date().getFullYear() + 1;

type ListingFacet =
  | "model"
  | "fuel"
  | "transmission"
  | "features"
  | "colour"
  | "serviceHistory"
  | "owners"
  | "condition";

type FacetFilter = {
  key: ListingFacet;
  label: string;
  icon: string;
  iconWidth: number;
  iconHeight: number;
  options: string[];
};

type FeatureCard = {
  title: string;
  description: string;
  image: string;
  warning?: boolean;
  width: number;
  height: number;
  alt: string;
};

type BuySellStep = {
  title: string;
  description: string;
  icon: string;
  width: number;
  height: number;
};

const filters: FacetFilter[] = [
  {
    key: "model",
    label: "Model",
    icon: "filter-model.svg",
    iconWidth: 13,
    iconHeight: 14,
    options: ["Toyota", "BMW", "Lexus", "Honda", "Yamaha", "Bosch", "Michelin"],
  },
  {
    key: "fuel",
    label: "Fuel",
    icon: "filter-fuel.svg",
    iconWidth: 14,
    iconHeight: 14,
    options: ["Petrol", "Diesel", "Electric"],
  },
  {
    key: "transmission",
    label: "Transmission",
    icon: "filter-transmission.svg",
    iconWidth: 17,
    iconHeight: 14,
    options: ["Automatic", "Manual"],
  },
  {
    key: "features",
    label: "Features",
    icon: "filter-features.svg",
    iconWidth: 13,
    iconHeight: 14,
    options: ["Parking sensors", "Leather seats"],
  },
  {
    key: "colour",
    label: "Colour",
    icon: "filter-colour.svg",
    iconWidth: 15,
    iconHeight: 14,
    options: ["Black", "White", "Silver"],
  },
  {
    key: "serviceHistory",
    label: "Service History",
    icon: "filter-service.svg",
    iconWidth: 12,
    iconHeight: 14,
    options: ["Full service history"],
  },
  {
    key: "owners",
    label: "Owners",
    icon: "filter-owner.svg",
    iconWidth: 14,
    iconHeight: 14,
    options: ["1st owner", "2nd owner"],
  },
  {
    key: "condition",
    label: "Vehicle Condition",
    icon: "filter-badge.svg",
    iconWidth: 12,
    iconHeight: 14,
    options: ["Excellent", "Good", "Needs work"],
  },
];

const featureGroups: { title: string; cards: FeatureCard[] }[] = [
  {
    title: "Damaged & Salvage Listings",
    cards: [
      {
        title: "Non-Functional Vehicles",
        description:
          "Sell non-functional or damaged vehicles for spare parts or restoration",
        image: "non-functional-car.png",
        warning: true,
        width: 835,
        height: 456,
        alt: "White car with a warning sign",
      },
      {
        title: "Verified Buyers",
        description: "Receive quick offers from verified buyers",
        image: "verified-buyers.png",
        width: 456,
        height: 456,
        alt: "Verified buyer badge",
      },
      {
        title: "Resale Options",
        description: "Access scrap or repair-based resale options",
        image: "resale-tools.png",
        width: 447,
        height: 456,
        alt: "Screwdriver and wrench",
      },
    ],
  },
  {
    title: "Certified Listings",
    cards: [
      {
        title: "Connect",
        description: "Connect with verified buyers",
        image: "connect.png",
        width: 456,
        height: 456,
        alt: "Connect with a verified buyer",
      },
      {
        title: "Market Trends",
        description: "Get competitive pricing based on market trends",
        image: "market-trends.png",
        width: 456,
        height: 456,
        alt: "Market trend illustration",
      },
      {
        title: "Feature Visibility",
        description: "Feature-rich listing for maximum visibility",
        image: "visibility.png",
        width: 547,
        height: 456,
        alt: "Listing visibility illustration",
      },
    ],
  },
];

const buyerSteps: BuySellStep[] = [
  {
    title: "Search & Filter",
    description: "Narrow down your options with advanced search tools",
    icon: "how-search.svg",
    width: 65,
    height: 64,
  },
  {
    title: "View & Compare",
    description: "Compare multiple listings to make an informed decision",
    icon: "how-compare.svg",
    width: 60,
    height: 64,
  },
  {
    title: "Contact Seller",
    description: "Get in touch with sellers instantly",
    icon: "how-contact.svg",
    width: 67,
    height: 64,
  },
  {
    title: "Schedule Viewing",
    description: "Pick a date and time to see the car in person.",
    icon: "how-schedule.svg",
    width: 69,
    height: 69,
  },
];

const sellerSteps: BuySellStep[] = [
  {
    title: "List Your Vehicle",
    description: "Create a listing and reach potential buyers.",
    icon: "how-search.svg",
    width: 65,
    height: 64,
  },
  {
    title: "Receive Enquiries",
    description: "Get instant buyer interest and offers",
    icon: "how-compare.svg",
    width: 60,
    height: 64,
  },
  {
    title: "Chat & Negotiate",
    description: "Communicate directly to close the best deal",
    icon: "how-contact.svg",
    width: 67,
    height: 64,
  },
  {
    title: "Complete the Deal",
    description: "Seal the deal with smooth transaction",
    icon: "how-deal.svg",
    width: 64,
    height: 64,
  },
];

const brands = [
  "brand-bugatti.png",
  "brand-bmw.png",
  "brand-mercedes.png",
  "brand-rolls-royce.png",
  "brand-harley-davidson.png",
  "brand-porsche.png",
];

function VehicleCard({
  listing,
  isFavorite,
  onToggleFavorite,
}: {
  listing: ProductListing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const image = listing.image_files[0]?.image;
  const isSparePart = listing.listing_type === "spare_part";
  const details = isSparePart
    ? [
        listing.brand || "Unbranded",
        listing.part_category || "Spare part",
        `${listing.quantity_available ?? 0} in stock`,
      ]
    : [
        listing.mileage_km === null
          ? "Mileage n/a"
          : `${listing.mileage_km.toLocaleString("en-US")} km`,
        listing.fuel_type || "Fuel n/a",
        listing.transmission || "Transmission n/a",
      ];

  return (
    <article className="buy-sell-vehicle-card">
      <div className="buy-sell-vehicle-photo">
        <span className="buy-sell-card-ribbon">
          {listing.listing_type.replace("_", " ").toUpperCase()}
        </span>
        {image ? (
          <Image
            className="buy-sell-listing-image"
            src={image}
            alt={listing.image_files[0]?.alt_text || listing.title}
            width={300}
            height={160}
            unoptimized
          />
        ) : (
          <div
            className={`buy-sell-listing-placeholder is-${listing.listing_type}`}
            role="img"
            aria-label={`${listing.listing_type.replace("_", " ")} photo unavailable`}
          >
            <span>{isSparePart ? listing.part_category : listing.make}</span>
            <strong>{isSparePart ? listing.brand : listing.model_name}</strong>
          </div>
        )}
        <button
          className={`buy-sell-favorite${isFavorite ? " is-favorite" : ""}`}
          type="button"
          aria-label={
            isFavorite ? "Remove from saved listings" : "Save listing"
          }
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
        >
          <Image
            src="/buy-sell/listing-heart.svg"
            alt=""
            width={20}
            height={20}
          />
        </button>
      </div>
      <div className="buy-sell-vehicle-details">
        <h3>{listing.title}</h3>
        <div className="buy-sell-vehicle-specs">
          {details.map((detail, index) => (
            <span key={detail}>
              {!isSparePart && (
                <Image
                  src={
                    [
                      "/buy-sell/listing-mileage.svg",
                      "/buy-sell/listing-fuel.svg",
                      "/buy-sell/listing-transmission.svg",
                    ][index]
                  }
                  alt=""
                  width={14}
                  height={13}
                />
              )}
              {detail}
            </span>
          ))}
        </div>
        <div className="buy-sell-owner">
          <Image
            src="/buy-sell/listing-owner.svg"
            alt=""
            width={16}
            height={16}
          />
          {listing.seller.name}
        </div>
        <div className="buy-sell-card-footer">
          <strong>
            {listing.currency}{" "}
            {Number(listing.price).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </strong>
          <Link href={`/buy-sell/listings/${listing.id}`}>
            View Details <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function FilterDisclosure({
  filterKey,
  label,
  icon,
  iconWidth,
  iconHeight,
  options,
  selectedOptions,
  onToggleOption,
}: {
  filterKey: ListingFacet;
  label: string;
  icon: string;
  iconWidth: number;
  iconHeight: number;
  options: string[];
  selectedOptions: string[];
  onToggleOption: (filterKey: ListingFacet, option: string) => void;
}) {
  return (
    <details className="buy-sell-filter-disclosure">
      <summary>
        <Image
          src={`/buy-sell/${icon}`}
          alt=""
          width={iconWidth}
          height={iconHeight}
        />
        <span>{label}</span>
        <Image
          className="buy-sell-filter-caret"
          src="/buy-sell/filter-caret.svg"
          alt=""
          width={17}
          height={16}
        />
      </summary>
      <div className="buy-sell-filter-options">
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={() => onToggleOption(filterKey, option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function FeatureGroup({
  title,
  cards,
}: {
  title: string;
  cards: FeatureCard[];
}) {
  return (
    <section className="buy-sell-feature-group">
      <div className="buy-sell-feature-heading">
        <h2>{title}</h2>
        <Link href="/register">
          <span style={{ textDecoration: "underline", fontSize: "15px" }}>
            List my vehicle
          </span>{" "}
          <span aria-hidden="true">⟶</span>
        </Link>
      </div>
      <div className="buy-sell-feature-grid">
        {cards.map((card) => (
          <article className="buy-sell-feature-card" key={card.title}>
            <div className="buy-sell-feature-art">
              <Image
                src={`/buy-sell/${card.image}`}
                alt={card.alt}
                width={card.width}
                height={card.height}
                sizes="148px"
              />
              {card.warning && (
                <Image
                  className="buy-sell-warning-sign"
                  src="/buy-sell/warning-sign.png"
                  alt=""
                  width={48}
                  height={48}
                />
              )}
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StepsRow({
  title,
  steps,
  variant,
}: {
  title: string;
  steps: BuySellStep[];
  variant: "buyers" | "sellers";
}) {
  return (
    <section className={`buy-sell-steps-row is-${variant}`}>
      <h3>{title}</h3>
      <div className="buy-sell-steps-track">
        {steps.map((step) => (
          <article className="buy-sell-step-card" key={step.title}>
            <Image
              src={`/buy-sell/${step.icon}`}
              alt=""
              width={step.width}
              height={step.height}
            />
            {/* <span className="buy-sell-step-number">0{index + 1}</span> */}
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BuySellExperience({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState(initialSearch);
  const [location, setLocation] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [activeType, setActiveType] = useState<ListingType>("car");
  const [sortOrder, setSortOrder] = useState("recommended");
  const [selectedFacets, setSelectedFacets] = useState<
    Partial<Record<ListingFacet, string[]>>
  >({});
  const [filterSearch, setFilterSearch] = useState("");
  const [minimumYear, setMinimumYear] = useState(MIN_LISTING_YEAR);
  const [maximumYear, setMaximumYear] = useState(MAX_LISTING_YEAR);
  const [minimumMileage, setMinimumMileage] = useState(0);
  const [maximumMileage, setMaximumMileage] = useState<number | null>(null);
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingError, setListingError] = useState("");
  const [reloadListings, setReloadListings] = useState(0);
  const [vehicleCondition, setVehicleCondition] = useState<
    "Normal" | "Accidental"
  >("Normal");
  const [favorites, setFavorites] = useState<number[]>([]);
  const mileageRangeLimit = Math.max(
    26_300,
    ...listings.map((listing) => listing.mileage_km ?? 0),
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchListings() {
      setIsLoadingListings(true);
      setListingError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/listings/`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Listings request failed (${response.status}).`);
        }
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isProductListing)) {
          throw new Error("The listings API returned an unexpected response.");
        }
        setListings(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setListingError(
          error instanceof Error
            ? error.message
            : "Unable to load listings right now.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingListings(false);
      }
    }

    void fetchListings();
    return () => controller.abort();
  }, [reloadListings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selected = (key: ListingFacet) => selectedFacets[key] ?? [];
    const filtered = listings.filter((listing) => {
      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query) ||
        listing.listing_type.replaceAll("_", " ").includes(query) ||
        listing.make.toLowerCase().includes(query) ||
        listing.model_name.toLowerCase().includes(query) ||
        listing.brand.toLowerCase().includes(query);
      const matchesLocation =
        !location ||
        listing.location.toLowerCase().includes(location.toLowerCase());
      const matchesActiveType = listing.listing_type === activeType;
      const matchesBrand =
        !brandModel ||
        listing.make.toLowerCase().includes(brandModel.toLowerCase()) ||
        listing.brand.toLowerCase().includes(brandModel.toLowerCase());
      const price = Number(listing.price);
      const matchesPrice =
        !priceRange ||
        (priceRange === "under-500000" && price < 500_000) ||
        (priceRange === "500000-1000000" &&
          price >= 500_000 &&
          price <= 1_000_000) ||
        (priceRange === "over-1000000" && price > 1_000_000);
      const yearRangeIsActive =
        minimumYear > MIN_LISTING_YEAR || maximumYear < MAX_LISTING_YEAR;
      const matchesYear =
        listing.year === null
          ? !yearRangeIsActive
          : listing.year >= minimumYear && listing.year <= maximumYear;
      const mileageRangeIsActive =
        minimumMileage > 0 ||
        (maximumMileage !== null && maximumMileage < mileageRangeLimit);
      const matchesMileage =
        listing.mileage_km === null
          ? !mileageRangeIsActive
          : listing.mileage_km >= minimumMileage &&
            listing.mileage_km <=
              (maximumMileage ?? Number.POSITIVE_INFINITY);
      const selectedModels = selected("model");
      const matchesModel =
        selectedModels.length === 0 ||
        selectedModels.some((model) =>
          `${listing.make} ${listing.model_name} ${listing.brand}`
            .toLowerCase()
            .includes(model.toLowerCase()),
        );
      const selectedFuel = selected("fuel");
      const matchesFuel =
        selectedFuel.length === 0 ||
        selectedFuel.some((fuel) => {
          const normalizedFuel = listing.fuel_type
            .toLowerCase()
            .replace("disel", "diesel");
          return normalizedFuel === fuel.toLowerCase();
        });
      const selectedTransmission = selected("transmission");
      const matchesTransmission =
        selectedTransmission.length === 0 ||
        selectedTransmission.some(
          (transmission) =>
            listing.transmission.toLowerCase() === transmission.toLowerCase(),
        );
      const selectedFeatures = selected("features");
      const matchesFeatures =
        selectedFeatures.length === 0 ||
        selectedFeatures.some((filterFeature) =>
          listing.features.some((feature) =>
            feature.toLowerCase().includes(filterFeature.toLowerCase()),
          ),
        );
      const selectedColours = selected("colour");
      const matchesColour =
        selectedColours.length === 0 ||
        selectedColours.some((colour) =>
          listing.color.toLowerCase().includes(colour.toLowerCase()),
        );
      const selectedServiceHistory = selected("serviceHistory");
      const matchesServiceHistory =
        selectedServiceHistory.length === 0 ||
        (selectedServiceHistory.includes("Full service history") &&
          listing.has_service_history);
      const selectedOwners = selected("owners");
      const matchesOwners =
        selectedOwners.length === 0 ||
        selectedOwners.some((owner) => {
          const expectedOwners = Number.parseInt(owner, 10);
          return listing.previous_owners === expectedOwners;
        });
      const selectedConditions = selected("condition");
      const normalizedCondition = listing.condition
        .replaceAll("_", " ")
        .toLowerCase();
      const matchesCondition =
        selectedConditions.length === 0 ||
        selectedConditions.some(
          (condition) =>
            condition.replaceAll("_", " ").toLowerCase() ===
            normalizedCondition,
        );

      return (
        matchesSearch &&
        matchesLocation &&
        matchesActiveType &&
        matchesBrand &&
        matchesPrice &&
        matchesYear &&
        matchesMileage &&
        matchesModel &&
        matchesFuel &&
        matchesTransmission &&
        matchesFeatures &&
        matchesColour &&
        matchesServiceHistory &&
        matchesOwners &&
        matchesCondition
      );
    });

    if (sortOrder === "price-low") {
      return filtered.sort(
        (first, second) => Number(first.price) - Number(second.price),
      );
    }
    if (sortOrder === "price-high") {
      return filtered.sort(
        (first, second) => Number(second.price) - Number(first.price),
      );
    }
    return filtered;
  }, [
    activeType,
    brandModel,
    listings,
    location,
    maximumMileage,
    mileageRangeLimit,
    maximumYear,
    minimumMileage,
    minimumYear,
    priceRange,
    search,
    selectedFacets,
    sortOrder,
  ]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document
      .getElementById("vehicle-listings")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function resetSearch() {
    setSearch("");
    setLocation("");
    setBrandModel("");
    setPriceRange("");
    setActiveType("car");
    setSortOrder("recommended");
    setSelectedFacets({});
    setFilterSearch("");
    setMinimumYear(MIN_LISTING_YEAR);
    setMaximumYear(MAX_LISTING_YEAR);
    setMinimumMileage(0);
    setMaximumMileage(null);
  }

  function toggleFacetOption(filterKey: ListingFacet, option: string) {
    setSelectedFacets((current) => {
      const selectedOptions = current[filterKey] ?? [];
      const nextOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((selectedOption) => selectedOption !== option)
        : [...selectedOptions, option];

      return { ...current, [filterKey]: nextOptions };
    });
  }

  function toggleFavorite(vehicleId: number) {
    setFavorites((current) =>
      current.includes(vehicleId)
        ? current.filter((id) => id !== vehicleId)
        : [...current, vehicleId],
    );
  }

  return (
    <main className="buy-sell-page">
      <section className="buy-sell-hero">
        <div className="buy-sell-hero-content">
          <h1>
            Buy &amp; Sell Cars, Bikes &amp; Spare Parts
            <br />
            <span>Fast, Secure &amp; Hassle-Free</span>
          </h1>
          <p className="buy-sell-hero-copy">
            Whether you&apos;re searching for your dream car or selling your old
            one, Pitstop makes transactions simple and seamless.
          </p>
          <Link
            className="buy-sell-hero-cta"
            href={isAuthenticated ? "/add-listing" : "/register"}
          >
            <span>{isAuthenticated ? "Sell your Listing" : "Sign Up"}</span>
            <Image
              src="/buy-sell/search-arrow.svg"
              alt=""
              width={24}
              height={24}
            />
          </Link>
        </div>
      </section>

      <section className="buy-sell-search-band" aria-label="Search listings">
        <form className="buy-sell-search-inner" onSubmit={submitSearch}>
          <div className="buy-sell-search-top">
            <label className="buy-sell-search-input">
              <span className="visually-hidden">Search listings</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
              />
            </label>
            <button className="buy-sell-view-all" type="submit">
              <span>VIEW ALL</span>
              <Image
                src="/buy-sell/search-arrow.svg"
                alt=""
                width={24}
                height={24}
              />
            </button>
          </div>
          <div className="buy-sell-search-filters">
            <label className="buy-sell-select">
              <span className="visually-hidden">Location</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                <option value="">Location</option>
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Sharjah">Sharjah</option>
              </select>
              <Image
                src="/buy-sell/search-caret.svg"
                alt=""
                width={14}
                height={13}
              />
            </label>
            <label className="buy-sell-select">
              <span className="visually-hidden">Listing category</span>
              <select
                value={activeType}
                onChange={(event) => {
                  const value = event.target.value;
                  if (
                    value === "car" ||
                    value === "bike" ||
                    value === "spare_part"
                  ) {
                    setActiveType(value);
                  }
                }}
              >
                <option value="car">Cars</option>
                <option value="bike">Bikes</option>
                <option value="spare_part">Spare Parts</option>
              </select>
              <Image
                src="/buy-sell/search-caret.svg"
                alt=""
                width={14}
                height={13}
              />
            </label>
            <label className="buy-sell-select">
              <span className="visually-hidden">Brand and model</span>
              <select
                value={brandModel}
                onChange={(event) => setBrandModel(event.target.value)}
              >
                <option value="">Brand Model</option>
                <option value="Toyota">Toyota</option>
                <option value="BMW">BMW</option>
                <option value="Lexus">Lexus</option>
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Bosch">Bosch</option>
                <option value="Michelin">Michelin</option>
              </select>
              <Image
                src="/buy-sell/search-caret.svg"
                alt=""
                width={14}
                height={13}
              />
            </label>
            <label className="buy-sell-select">
              <span className="visually-hidden">Price range</span>
              <select
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value)}
              >
                <option value="">Price Range</option>
                <option value="under-500000">Under AED 500,000</option>
                <option value="500000-1000000">AED 500,000 - 1,000,000</option>
                <option value="over-1000000">Over AED 1,000,000</option>
              </select>
              <Image
                src="/buy-sell/search-caret.svg"
                alt=""
                width={14}
                height={13}
              />
            </label>
          </div>
        </form>
      </section>

      <section className="buy-sell-catalog" id="vehicle-listings">
        <div className="buy-sell-catalog-inner">
          <div className="buy-sell-catalog-toolbar">
            <div
              className="buy-sell-type-tabs"
              role="group"
              aria-label="Listing category"
            >
              <button
                type="button"
                className={activeType === "car" ? "is-active" : ""}
                aria-pressed={activeType === "car"}
                onClick={() => setActiveType("car")}
              >
                Cars
              </button>
              <button
                type="button"
                className={activeType === "bike" ? "is-active" : ""}
                aria-pressed={activeType === "bike"}
                onClick={() => setActiveType("bike")}
              >
                Bikes
              </button>
              <button
                type="button"
                className={activeType === "spare_part" ? "is-active" : ""}
                aria-pressed={activeType === "spare_part"}
                onClick={() => setActiveType("spare_part")}
              >
                Spare Parts
              </button>
            </div>
            <label className="buy-sell-sort">
              <span>Sort By</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <Image
                src="/buy-sell/search-caret.svg"
                alt=""
                width={14}
                height={13}
              />
            </label>
          </div>

          <div className="buy-sell-catalog-layout">
            <aside
              className="buy-sell-filter-panel"
              aria-label="Listing filters"
            >
              <div className="buy-sell-filter-heading">
                <h2>Filters</h2>
                <button type="button" onClick={resetSearch}>
                  Clear all
                </button>
              </div>
              <label className="buy-sell-filter-search">
                <span className="visually-hidden">Search filters</span>
                <input
                  value={filterSearch}
                  onChange={(event) => setFilterSearch(event.target.value)}
                  placeholder="Search filters"
                  aria-label="Search filters"
                />
              </label>

              {filters
                .filter((filter) => filter.key === "model")
                .map((filter) => {
                  const filterQuery = filterSearch.trim().toLowerCase();
                  const visibleOptions = filter.options.filter((option) =>
                    option.toLowerCase().includes(filterQuery),
                  );
                  if (
                    filterQuery &&
                    !filter.label.toLowerCase().includes(filterQuery) &&
                    visibleOptions.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <FilterDisclosure
                      key={filter.key}
                      filterKey={filter.key}
                      label={filter.label}
                      icon={filter.icon}
                      iconWidth={filter.iconWidth}
                      iconHeight={filter.iconHeight}
                      options={filterQuery ? visibleOptions : filter.options}
                      selectedOptions={selectedFacets[filter.key] ?? []}
                      onToggleOption={toggleFacetOption}
                    />
                  );
                })}
              <div className="buy-sell-range-filter">
                <div className="buy-sell-filter-range-title">
                  <Image
                    src="/buy-sell/filter-model.svg"
                    alt=""
                    width={13}
                    height={14}
                  />
                  <span>Year</span>
                </div>
                <div className="buy-sell-range-values">
                  <span>{minimumYear.toLocaleString("en-US")}</span>
                  <span>{maximumYear.toLocaleString("en-US")}</span>
                </div>
                <input
                  aria-label="Minimum year"
                  type="range"
                  min={MIN_LISTING_YEAR}
                  max={maximumYear}
                  value={minimumYear}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMinimumYear(Math.min(value, maximumYear));
                  }}
                />
                <input
                  aria-label="Maximum year"
                  type="range"
                  min={minimumYear}
                  max={MAX_LISTING_YEAR}
                  value={maximumYear}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMaximumYear(Math.max(value, minimumYear));
                  }}
                />
                <div className="buy-sell-range-caption">
                  <span>Minimum</span>
                  <span>Maximum</span>
                </div>
              </div>
              <div className="buy-sell-range-filter">
                <div className="buy-sell-filter-range-title">
                  <Image
                    src="/buy-sell/filter-kilometers.svg"
                    alt=""
                    width={18}
                    height={14}
                  />
                  <span>Kms Driven</span>
                </div>
                <div className="buy-sell-range-values">
                  <span>{minimumMileage.toLocaleString("en-US")}</span>
                  <span>
                    {(maximumMileage ?? mileageRangeLimit).toLocaleString(
                      "en-US",
                    )}
                  </span>
                </div>
                <input
                  aria-label="Minimum kilometers driven"
                  type="range"
                  min={0}
                  max={maximumMileage ?? mileageRangeLimit}
                  value={minimumMileage}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMinimumMileage(
                      Math.min(value, maximumMileage ?? mileageRangeLimit),
                    );
                  }}
                />
                <input
                  aria-label="Maximum kilometers driven"
                  type="range"
                  min={minimumMileage}
                  max={mileageRangeLimit}
                  value={maximumMileage ?? mileageRangeLimit}
                  onChange={(event) =>
                    setMaximumMileage(Number(event.target.value))
                  }
                />
                <div className="buy-sell-range-caption">
                  <span>Minimum</span>
                  <span>Maximum</span>
                </div>
              </div>
              {filters
                .filter((filter) => filter.key !== "model")
                .map((filter) => {
                  const filterQuery = filterSearch.trim().toLowerCase();
                  const visibleOptions = filter.options.filter((option) =>
                    option.toLowerCase().includes(filterQuery),
                  );
                  if (
                    filterQuery &&
                    !filter.label.toLowerCase().includes(filterQuery) &&
                    visibleOptions.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <FilterDisclosure
                      key={filter.key}
                      filterKey={filter.key}
                      label={filter.label}
                      icon={filter.icon}
                      iconWidth={filter.iconWidth}
                      iconHeight={filter.iconHeight}
                      options={filterQuery ? visibleOptions : filter.options}
                      selectedOptions={selectedFacets[filter.key] ?? []}
                      onToggleOption={toggleFacetOption}
                    />
                  );
                })}
            </aside>

            <div className="buy-sell-results">
              <div className="buy-sell-results-heading">
                <div>
                  <p className="buy-sell-eyebrow">Explore active listings</p>
                  <h2>
                    {activeType === "spare_part"
                      ? "Explore Spare Parts"
                      : `Explore ${activeType === "car" ? "Cars" : "Bikes"}`}
                  </h2>
                </div>
                <span>
                  {filteredListings.length}{" "}
                  {activeType === "spare_part" ? "parts" : "vehicles"} found
                </span>
              </div>
              <div className="buy-sell-results-grid">
                {filteredListings.map((listing) => (
                  <VehicleCard
                    key={listing.id}
                    listing={listing}
                    isFavorite={favorites.includes(listing.id)}
                    onToggleFavorite={() => toggleFavorite(listing.id)}
                  />
                ))}
                {isLoadingListings && (
                  <div className="buy-sell-empty-results" role="status">
                    Loading listings…
                  </div>
                )}
                {!isLoadingListings && listingError && (
                  <div className="buy-sell-empty-results" role="alert">
                    <h3>Listings are unavailable</h3>
                    <p>{listingError}</p>
                    <button
                      type="button"
                      onClick={() => setReloadListings((count) => count + 1)}
                    >
                      Try again
                    </button>
                  </div>
                )}
                {!isLoadingListings &&
                  !listingError &&
                  filteredListings.length === 0 && (
                    <div className="buy-sell-empty-results">
                      <h3>No listings found</h3>
                      <p>
                        Try another search or clear your filters to see all
                        listings.
                      </p>
                      <button type="button" onClick={resetSearch}>
                        Clear filters
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="buy-sell-seller">
        <div className="buy-sell-seller-inner">
          <div className="buy-sell-seller-copy">
            <p>Ready to sell?</p>
            <h2>
              Sell Your Car, Bike or Spare Part
              <span>Get the Best Deal Instantly.</span>
            </h2>
          </div>
          <div className="buy-sell-seller-form">
            <div
              className="buy-sell-seller-tabs"
              role="group"
              aria-label="Vehicle condition"
            >
              <button
                type="button"
                className={vehicleCondition === "Normal" ? "is-active" : ""}
                aria-pressed={vehicleCondition === "Normal"}
                onClick={() => setVehicleCondition("Normal")}
              >
                Normal
              </button>
              <button
                type="button"
                className={vehicleCondition === "Accidental" ? "is-active" : ""}
                aria-pressed={vehicleCondition === "Accidental"}
                onClick={() => setVehicleCondition("Accidental")}
              >
                Accidental
              </button>
            </div>
            <label>
              <span>Enter Your Details</span>
              <input type="tel" placeholder="XX  XXX  XXXX" />
            </label>
            <label>
              <span>Enter Your Car/Bike Details</span>
              <input type="text" placeholder="XX  XXX  XXXX" />
            </label>
            <Link className="buy-sell-list-vehicle" href="/register">
              List My Vehicle
            </Link>
            <div className="buy-sell-or">
              <span>OR</span>
            </div>
            <p className="buy-sell-brand-prompt">Select your Car/ Bike Brand</p>
            <div className="buy-sell-brand-grid">
              {brands.map((brand, index) => (
                <button
                  type="button"
                  key={brand}
                  aria-label={`Browse brand ${index + 1}`}
                >
                  <Image
                    src={`/buy-sell/${brand}`}
                    alt=""
                    width={50}
                    height={50}
                    sizes="50px"
                  />
                </button>
              ))}
              <Link href="/register">View All</Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="buy-sell-features"
        aria-label="Pitstop listing features"
      >
        <div className="buy-sell-features-inner">
          {featureGroups.map((group) => (
            <FeatureGroup
              key={group.title}
              title={group.title}
              cards={group.cards}
            />
          ))}
        </div>
      </section>

      <section className="buy-sell-why">
        <h2>
          Why Choose <span>Pitstop</span>
        </h2>
        <div className="buy-sell-why-stage">
          <Image
            className="buy-sell-orbit buy-sell-orbit-back"
            src="/buy-sell/why-orbit-2.svg"
            alt=""
            width={744}
            height={744}
          />
          <Image
            className="buy-sell-orbit buy-sell-orbit-mid"
            src="/buy-sell/why-orbit-1.svg"
            alt=""
            width={503}
            height={503}
          />
          <Image
            className="buy-sell-orbit buy-sell-orbit-top-left"
            src="/buy-sell/why-orbit-4.svg"
            alt=""
            width={256}
            height={256}
          />
          <Image
            className="buy-sell-orbit buy-sell-orbit-top-right"
            src="/buy-sell/why-orbit-3.svg"
            alt=""
            width={256}
            height={256}
          />
          <Image
            className="buy-sell-orbit buy-sell-orbit-bottom-left"
            src="/buy-sell/why-orbit-5.svg"
            alt=""
            width={256}
            height={256}
          />
          <Image
            className="buy-sell-orbit buy-sell-orbit-bottom-right"
            src="/buy-sell/why-orbit-5.svg"
            alt=""
            width={256}
            height={256}
          />
          <div className="buy-sell-why-copy buy-sell-why-top-left">
            <h3>
              Verified Buyers
              <br />
              &amp; Sellers
            </h3>
            <p>Secure transactions with trusted users</p>
          </div>
          <div className="buy-sell-why-copy buy-sell-why-top-right">
            <h3>
              Smart Pricing
              <br />
              Suggestion
            </h3>
            <p>Get competitive rates based on real-time market trends</p>
          </div>
          <div className="buy-sell-why-copy buy-sell-why-bottom-left">
            <h3>
              Exclusive
              <br />
              Salvage Listings
            </h3>
            <p>
              The only platform in the UAE offering a resale solution for
              damaged vehicles
            </p>
          </div>
          <div className="buy-sell-why-copy buy-sell-why-bottom-right">
            <h3>Easy Listings</h3>
            <p>Post your car or bike in minutes</p>
          </div>
          <div className="buy-sell-why-car">
            <Image
              src="/buy-sell/why-car.png"
              alt="White sports car viewed from above"
              width={4096}
              height={3277}
              sizes="608px"
            />
          </div>
        </div>
      </section>

      <section className="buy-sell-how">
        <div className="buy-sell-how-title">
          <h2>
            How It <span>Works</span>
          </h2>
        </div>
        <StepsRow title="For Buyers" steps={buyerSteps} variant="buyers" />
        <StepsRow title="For Sellers" steps={sellerSteps} variant="sellers" />
      </section>
    </main>
  );
}
