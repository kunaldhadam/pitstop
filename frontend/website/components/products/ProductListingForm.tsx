"use client";

import { useState, type FormEvent } from "react";
import {
  requestProductApi,
  type ProductListing,
  type ListingType,
} from "@/lib/product-listings";

type ProductListingFormProps = {
  listing?: ProductListing;
  onCancel: () => void;
  onSaved: () => void;
};

const conditionOptions: Record<ListingType, { value: string; label: string }[]> =
  {
    car: [
      { value: "used", label: "Used" },
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "needs_work", label: "Needs work" },
      { value: "damaged", label: "Damaged" },
    ],
    bike: [
      { value: "used", label: "Used" },
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "needs_work", label: "Needs work" },
      { value: "damaged", label: "Damaged" },
    ],
    spare_part: [
      { value: "new", label: "New" },
      { value: "used", label: "Used" },
      { value: "refurbished", label: "Refurbished" },
    ],
  };

export default function ProductListingForm({
  listing,
  onCancel,
  onSaved,
}: ProductListingFormProps) {
  const [listingType, setListingType] = useState<ListingType>(
    listing?.listing_type ?? "car",
  );
  const [condition, setCondition] = useState(listing?.condition ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [compatibleVehicles, setCompatibleVehicles] = useState(() =>
    JSON.stringify(
      listing?.compatible_vehicles ?? [
        { make: "", model: "", year_from: "", year_to: "" },
      ],
      null,
      2,
    ),
  );
  const minimumPhotos = listingType === "spare_part" ? 3 : 1;

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const photos = form.querySelector<HTMLInputElement>(
        'input[name="images"]',
      )?.files;
      const addedPhotos = photos ? Array.from(photos) : [];
      if (!listing && addedPhotos.length < minimumPhotos) {
        throw new Error(
          `Upload at least ${minimumPhotos} ${
            minimumPhotos === 1 ? "photo" : "photos"
          } for this listing.`,
        );
      }
      if (
        addedPhotos.length > 10 ||
        (listing && listing.image_files.length + addedPhotos.length > 10)
      ) {
        throw new Error("A listing can have no more than 10 photos.");
      }

      formData.set("listing_type", listingType);
      formData.set(
        "is_price_negotiable",
        formData.has("is_price_negotiable") ? "true" : "false",
      );
      formData.set(
        "has_service_history",
        formData.has("has_service_history") ? "true" : "false",
      );
      formData.set(
        "features",
        JSON.stringify(
          String(formData.get("features") ?? "")
            .split(",")
            .map((feature) => feature.trim())
            .filter(Boolean),
        ),
      );
      for (const optionalNumberField of ["mileage_km", "previous_owners"]) {
        if (formData.get(optionalNumberField) === "") {
          formData.delete(optionalNumberField);
        }
      }
      if (listingType === "spare_part") {
        let parsedVehicles: unknown;
        try {
          parsedVehicles = JSON.parse(compatibleVehicles);
        } catch {
          throw new Error(
            "Compatible vehicles must be a valid JSON array.",
          );
        }
        if (!Array.isArray(parsedVehicles)) {
          throw new Error("Compatible vehicles must be a JSON array.");
        }
        formData.set("compatible_vehicles", JSON.stringify(parsedVehicles));
      } else {
        formData.delete("compatible_vehicles");
      }

      const isEditing = Boolean(listing);
      const response = await requestProductApi(
        isEditing
          ? `/api/products/listings/${listing?.id}/`
          : "/api/products/listings/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: formData,
        },
      );
      await response.json();
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your listing could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="product-listing-form-card" aria-labelledby="listing-form-title">
      <header className="product-listing-form-heading">
        <div>
          <p className="product-listing-eyebrow">
            {listing ? "Update your listing" : "Reach more buyers"}
          </p>
          <h2 id="listing-form-title">
            {listing ? "Edit listing" : "Create a listing"}
          </h2>
        </div>
        <button
          className="product-listing-button is-secondary"
          type="button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </header>

      <form className="product-listing-form" onSubmit={saveListing}>
        <fieldset disabled={isSaving}>
          <legend>Listing details</legend>
          <div className="product-listing-fields">
            <label>
              Category
              <select
                value={listingType}
                onChange={(event) => {
                  const value = event.target.value;
                  if (
                    value === "car" ||
                    value === "bike" ||
                    value === "spare_part"
                  ) {
                    setListingType(value);
                    setCondition(
                      value === "spare_part" ? "new" : "used",
                    );
                  }
                }}
                disabled={Boolean(listing)}
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="spare_part">Spare part</option>
              </select>
            </label>
            <label>
              Listing title
              <input
                name="title"
                required
                maxLength={160}
                defaultValue={listing?.title ?? ""}
                placeholder="e.g. 2022 Toyota Camry"
              />
            </label>
            <label>
              Price (AED)
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={listing?.price ?? ""}
              />
            </label>
            <label>
              Location
              <input
                name="location"
                required
                maxLength={160}
                defaultValue={listing?.location ?? ""}
                placeholder="City or area"
              />
            </label>
            <label>
              Condition
              <select
                name="condition"
                required
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
              >
                <option value="" disabled>
                  Choose condition
                </option>
                {conditionOptions[listingType].map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="product-listing-checkbox">
              <input
                name="is_price_negotiable"
                type="checkbox"
                defaultChecked={listing?.is_price_negotiable ?? false}
              />
              Price is negotiable
            </label>
            <label className="product-listing-field-wide">
              Description
              <textarea
                name="description"
                required
                rows={4}
                defaultValue={listing?.description ?? ""}
                placeholder="Share the details buyers should know"
              />
            </label>
          </div>
        </fieldset>

        {listingType !== "spare_part" ? (
          <fieldset disabled={isSaving}>
            <legend>Vehicle details</legend>
            <div className="product-listing-fields">
              <label>
                Make
                <input
                  name="make"
                  required
                  maxLength={100}
                  defaultValue={listing?.make ?? ""}
                />
              </label>
              <label>
                Model
                <input
                  name="model_name"
                  required
                  maxLength={100}
                  defaultValue={listing?.model_name ?? ""}
                />
              </label>
              <label>
                Year
                <input
                  name="year"
                  type="number"
                  min="1886"
                  max={new Date().getFullYear() + 1}
                  required
                  defaultValue={listing?.year ?? ""}
                />
              </label>
              <label>
                Mileage (km)
                <input
                  name="mileage_km"
                  type="number"
                  min="0"
                  defaultValue={listing?.mileage_km ?? ""}
                />
                {listing && (
                  <span className="product-listing-help">
                    Leave blank to keep the current value.
                  </span>
                )}
              </label>
              <label>
                Fuel type
                <input
                  name="fuel_type"
                  maxLength={32}
                  defaultValue={listing?.fuel_type ?? ""}
                  placeholder="Petrol, diesel, electric..."
                />
              </label>
              <label>
                Transmission
                <input
                  name="transmission"
                  maxLength={32}
                  defaultValue={listing?.transmission ?? ""}
                  placeholder="Automatic or manual"
                />
              </label>
              <label>
                Colour
                <input
                  name="color"
                  maxLength={48}
                  defaultValue={listing?.color ?? ""}
                />
              </label>
              <label>
                Previous owners
                <input
                  name="previous_owners"
                  type="number"
                  min="0"
                  defaultValue={listing?.previous_owners ?? ""}
                />
                {listing && (
                  <span className="product-listing-help">
                    Leave blank to keep the current value.
                  </span>
                )}
              </label>
              <label>
                Features
                <input
                  name="features"
                  defaultValue={listing?.features.join(", ") ?? ""}
                  placeholder="Separate features with commas"
                />
              </label>
              <label className="product-listing-checkbox">
                <input
                  name="has_service_history"
                  type="checkbox"
                  defaultChecked={listing?.has_service_history ?? false}
                />
                Full service history
              </label>
            </div>
          </fieldset>
        ) : (
          <fieldset disabled={isSaving}>
            <legend>Part details</legend>
            <div className="product-listing-fields">
              <label>
                Part name
                <input
                  name="part_name"
                  required
                  maxLength={160}
                  defaultValue={listing?.part_name ?? ""}
                />
              </label>
              <label>
                Category
                <input
                  name="part_category"
                  required
                  maxLength={100}
                  defaultValue={listing?.part_category ?? ""}
                />
              </label>
              <label>
                Subcategory
                <input
                  name="part_subcategory"
                  required
                  maxLength={100}
                  defaultValue={listing?.part_subcategory ?? ""}
                />
              </label>
              <label>
                Brand
                <input
                  name="brand"
                  required
                  maxLength={100}
                  defaultValue={listing?.brand ?? ""}
                />
              </label>
              <label>
                OEM part number
                <input
                  name="oem_part_number"
                  maxLength={100}
                  defaultValue={listing?.oem_part_number ?? ""}
                />
              </label>
              <label>
                Quantity available
                <input
                  name="quantity_available"
                  type="number"
                  min="0"
                  required
                  defaultValue={listing?.quantity_available ?? ""}
                />
              </label>
              <label className="product-listing-field-wide">
                Compatible vehicles (JSON array)
                <textarea
                  rows={5}
                  value={compatibleVehicles}
                  onChange={(event) =>
                    setCompatibleVehicles(event.target.value)
                  }
                  spellCheck={false}
                  aria-describedby="compatible-vehicles-help"
                />
                <span id="compatible-vehicles-help" className="product-listing-help">
                  Include make, model, year_from, and year_to for each vehicle.
                </span>
              </label>
              <label className="product-listing-field-wide">
                Warranty details
                <textarea
                  name="warranty_details"
                  rows={2}
                  defaultValue={listing?.warranty_details ?? ""}
                />
              </label>
              <label className="product-listing-field-wide">
                Return policy
                <textarea
                  name="return_policy"
                  rows={2}
                  defaultValue={listing?.return_policy ?? ""}
                />
              </label>
              {listingType === "spare_part" &&
                condition === "used" && (
                  <label className="product-listing-field-wide">
                    Video (MP4, MOV, or WebM; max 50 MB)
                    <input
                      name="video"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                    />
                    {listing?.video && (
                      <span className="product-listing-help">
                        A video is already attached. Choose a file to replace it.
                      </span>
                    )}
                  </label>
                )}
            </div>
          </fieldset>
        )}

        <fieldset disabled={isSaving}>
          <legend>Photos</legend>
          {listing?.image_files.length ? (
            <div className="product-listing-current-photos">
              <p>
                {listing.image_files.length} photo
                {listing.image_files.length === 1 ? "" : "s"} currently uploaded.
                You can add more below.
              </p>
            </div>
          ) : null}
          <label className="product-listing-photo-input">
            {listing ? "Add more photos" : "Upload photos"}
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              required={!listing}
            />
            <span>
              {listing
                ? "Optional; up to 10 photos total."
                : `At least ${minimumPhotos} photo${
                    minimumPhotos === 1 ? "" : "s"
                  } required, up to 10 total.`}
            </span>
          </label>
        </fieldset>

        {error && (
          <p className="product-listing-error" role="alert">
            {error}
          </p>
        )}
        <div className="product-listing-form-actions">
          <button
            className="product-listing-button"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : listing ? "Save changes" : "Submit listing"}
          </button>
          {listing && (
            <span className="product-listing-help">
              Changes to an approved listing require a new review.
            </span>
          )}
          {!listing && (
            <span className="product-listing-help">
              New listings are reviewed before they appear publicly.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
