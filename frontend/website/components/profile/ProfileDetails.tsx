"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ProfileDocument {
  id: number;
  file: string;
  name: string;
  uploaded_at: string;
}

export type BusinessPurpose = string;

export interface ProfileUser {
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number: string | null;
  contact_person_name: string | null;
  usertype: string | null;
  date_joined?: string;
  individual_profile?: {
    purpose: string | null;
    preferred_location: string | null;
    vehicle_make: string | null;
    profile_picture: string | null;
  };
  garage_owner_profile?: {
    business_name: string | null;
    purposes: BusinessPurpose[] | null;
    trade_license_number: string | null;
    vat_gst_number: string | null;
    profile_picture: string | null;
    business_address: string | null;
    operating_hours: string | null;
    services_offered: string | null;
    type_of_vehicles_serviced: string | null;
  };
  profile_details?: {
    street_address: string;
    date_of_birth: string | null;
    gender: string;
    facebook_url: string;
    twitter_url: string;
    kyc_status: string;
    documents: ProfileDocument[];
  };
}

interface ProfileForm {
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  preferred_location: string;
  street_address: string;
  date_of_birth: string;
  gender: string;
  facebook_url: string;
  twitter_url: string;
}

interface ProfileDetailsProps {
  user: ProfileUser;
  apiBaseUrl: string;
  onUserUpdated?: (user: ProfileUser) => void;
}

const emptyProfileDetails: NonNullable<ProfileUser["profile_details"]> = {
  street_address: "",
  date_of_birth: null,
  gender: "",
  facebook_url: "",
  twitter_url: "",
  kyc_status: "pending",
  documents: [],
};

const readFormValues = (user: ProfileUser): ProfileForm => {
  const [fallbackFirstName = "", ...fallbackLastName] = (
    user.contact_person_name || ""
  )
    .trim()
    .split(/\s+/);

  return {
    first_name: user.first_name || fallbackFirstName,
    last_name: user.last_name || fallbackLastName.join(" "),
    username: user.username || "",
    phone_number: user.phone_number || "",
    preferred_location: user.individual_profile?.preferred_location || "",
    street_address: user.profile_details?.street_address || "",
    date_of_birth: user.profile_details?.date_of_birth || "",
    gender: user.profile_details?.gender || "",
    facebook_url: user.profile_details?.facebook_url || "",
    twitter_url: user.profile_details?.twitter_url || "",
  };
};

const readCsrfToken = () =>
  document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("csrftoken="))
    ?.split("=")[1];

const mediaUrl = (apiBaseUrl: string, path: string) =>
  /^https?:\/\//i.test(path) ? path : `${apiBaseUrl}${path}`;

const getCsrfToken = async (apiBaseUrl: string) => {
  let token = readCsrfToken();
  if (!token) {
    await fetch(`${apiBaseUrl}/_allauth/browser/v1/config`, {
      credentials: "include",
    });
    token = readCsrfToken();
  }

  if (!token) {
    throw new Error(
      "Unable to initialize secure profile updates. Refresh and try again.",
    );
  }

  return decodeURIComponent(token);
};

const profileFields: {
  key: keyof ProfileForm | "email" | "member_since";
  label: string;
  icon?: "home" | "calendar" | "gender";
}[] = [
  { key: "first_name", label: "Name" },
  { key: "last_name", label: "Surname" },
  { key: "username", label: "User name" },
  { key: "email", label: "Email ID" },
  { key: "phone_number", label: "Mobile Number" },
  { key: "member_since", label: "Member since" },
  { key: "preferred_location", label: "Live in", icon: "home" },
  { key: "street_address", label: "Street Address", icon: "home" },
  { key: "date_of_birth", label: "Date Of Birth", icon: "calendar" },
  { key: "gender", label: "Gender", icon: "gender" },
];

const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export default function ProfileDetails({
  user,
  apiBaseUrl,
  onUserUpdated,
}: ProfileDetailsProps) {
  const [currentUser, setCurrentUser] = useState(user);
  const [form, setForm] = useState(() => readFormValues(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentsInputRef = useRef<HTMLInputElement>(null);
  const details: NonNullable<ProfileUser["profile_details"]> =
    currentUser.profile_details ?? emptyProfileDetails;
  const profileImage = currentUser.individual_profile?.profile_picture
    ? mediaUrl(apiBaseUrl, currentUser.individual_profile.profile_picture)
    : currentUser.garage_owner_profile?.profile_picture
      ? mediaUrl(apiBaseUrl, currentUser.garage_owner_profile.profile_picture)
      : null;

  const [fullName = "", ...surnameParts] = (
    currentUser.contact_person_name || currentUser.username
  )
    .trim()
    .split(/\s+/);
  const firstName = currentUser.first_name || fullName || "Not provided";
  const surname =
    currentUser.last_name || surnameParts.join(" ") || "Not provided";

  useEffect(() => {
    if (!apiBaseUrl) return;

    let active = true;

    fetch(`${apiBaseUrl}/api/accounts/me/`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load the latest profile details.");
        }
        return (await response.json()) as ProfileUser;
      })
      .then((data) => {
        if (active) {
          setCurrentUser(data);
          setForm(readFormValues(data));
          onUserUpdated?.(data);
        }
      })
      .catch((fetchError: unknown) => {
        if (active) {
          console.error("Error refreshing profile details:", fetchError);
          setError(
            "Could not refresh your profile details. Please reload the page.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [apiBaseUrl, onUserUpdated]);

  const commitUser = (updatedUser: ProfileUser) => {
    setCurrentUser(updatedUser);
    setForm(readFormValues(updatedUser));
    onUserUpdated?.(updatedUser);
  };

  const patchProfile = async (data: FormData) => {
    const csrfToken = await getCsrfToken(apiBaseUrl);
    const response = await fetch(`${apiBaseUrl}/api/accounts/me/`, {
      method: "PATCH",
      credentials: "include",
      headers: { "X-CSRFToken": csrfToken },
      body: data,
    });
    const responseData = await response.json();

    if (!response.ok) {
      const detail =
        responseData.detail ||
        Object.values(responseData).flat().join(" ") ||
        "Your profile could not be saved.";
      throw new Error(detail);
    }

    return responseData as ProfileUser;
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      const updatedUser = await patchProfile(data);
      commitUser(updatedUser);
      setIsEditing(false);
      setMessage("Profile details saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your profile could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const data = new FormData();
      data.append("profile_picture", file);
      commitUser(await patchProfile(data));
      setMessage("Profile photo updated.");
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "Your profile photo could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deletePhoto = async () => {
    if (!profileImage || !window.confirm("Delete your profile photo?")) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const data = new FormData();
      data.append("remove_profile_picture", "true");
      commitUser(await patchProfile(data));
      setMessage("Profile photo deleted.");
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "Your profile photo could not be deleted.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocuments = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verificationFiles.length === 0) {
      setError("Choose at least one PDF, JPG, or PNG document.");
      return;
    }

    setIsUploadingDocuments(true);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken(apiBaseUrl);
      const data = new FormData();
      verificationFiles.forEach((file) => data.append("files", file));
      const response = await fetch(
        `${apiBaseUrl}/api/accounts/me/verification-documents/`,
        {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRFToken": csrfToken },
          body: data,
        },
      );
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.files ||
            responseData.detail ||
            "Verification documents could not be uploaded.",
        );
      }

      commitUser(responseData as ProfileUser);
      setVerificationFiles([]);
      setShowVerificationForm(false);
      setMessage("Verification documents uploaded.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Verification documents could not be uploaded.",
      );
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  const updateForm = (key: keyof ProfileForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const dateJoined = currentUser.date_joined
    ? new Date(currentUser.date_joined).toLocaleDateString()
    : "Not provided";

  return (
    <main className="profile-screen">
      <header className="profile-screen-header">
        <h1>Profile</h1>
        <div className="profile-tabs" aria-label="Profile sections">
          <Link
            className="profile-tab is-active"
            href="/profile"
            aria-current="page"
          >
            My details
          </Link>
          <Link className="profile-tab" href="/profile/my-listings">
            Car Listing Summary
          </Link>
        </div>
      </header>

      <form onSubmit={saveProfile}>
        <section
          className="profile-details-section"
          aria-labelledby="my-details-heading"
        >
          <div className="profile-section-heading">
            <div>
              <h2 id="my-details-heading">My details</h2>
              <p>Update your personal details here.</p>
            </div>
            <div className="profile-heading-actions">
              <p className="profile-last-active">
                Last Active : Last login 2 hours ago
              </p>
              {isEditing ? (
                <>
                  <button
                    className="profile-secondary-button"
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setForm(readFormValues(currentUser));
                      setIsEditing(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="profile-edit-button"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button
                  className="profile-edit-button"
                  type="button"
                  onClick={() => {
                    setForm(readFormValues(currentUser));
                    setIsEditing(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  <span>Edit</span>
                  <Image
                    src="/profile-assets/edit.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="profile-photo-row">
            <div className="profile-photo-copy">
              <div>
                <h3>Your photo</h3>
                <p>This will be displayed on your profile.</p>
              </div>
              <Image
                className="profile-avatar"
                src={profileImage || "/profile-assets/avatar.png"}
                alt={`${firstName} profile`}
                width={64}
                height={64}
                unoptimized
              />
            </div>
            <div className="profile-photo-actions">
              <input
                ref={photoInputRef}
                className="profile-hidden-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                disabled={isSaving || !profileImage}
                onClick={deletePhoto}
              >
                Delete
              </button>
              <button
                className="profile-photo-update"
                type="button"
                disabled={isSaving}
                onClick={() => photoInputRef.current?.click()}
              >
                Update
              </button>
            </div>
          </div>

          <div className="profile-fields">
            {profileFields.map(({ key, label, icon }) => (
              <div className="profile-field" key={key}>
                <span className="profile-field-label">{label}</span>
                <div
                  className={`profile-field-value${isEditing ? " is-editing" : ""}`}
                >
                  {icon && (
                    <span
                      className={`profile-field-icon profile-field-icon-${icon}`}
                      aria-hidden="true"
                    >
                      {icon === "home" && (
                        <Image
                          src="/profile-assets/home.svg"
                          alt=""
                          width={24}
                          height={24}
                        />
                      )}
                      {icon === "calendar" &&
                        ["1", "2", "3", "4"].map((part) => (
                          <Image
                            key={part}
                            className={`profile-calendar-part-${part}`}
                            src={`/profile-assets/calendar-${part}.svg`}
                            alt=""
                            width={24}
                            height={24}
                          />
                        ))}
                      {icon === "gender" &&
                        ["1", "2", "3"].map((part) => (
                          <Image
                            key={part}
                            className={`profile-gender-part-${part}`}
                            src={`/profile-assets/gender-${part}.svg`}
                            alt=""
                            width={24}
                            height={24}
                          />
                        ))}
                    </span>
                  )}
                  {isEditing && key !== "email" && key !== "member_since" ? (
                    key === "gender" ? (
                      <select
                        className="profile-field-control"
                        value={form[key]}
                        onChange={(event) =>
                          updateForm(key, event.target.value)
                        }
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">
                          Prefer not to say
                        </option>
                      </select>
                    ) : (
                      <input
                        className="profile-field-control"
                        type={key === "date_of_birth" ? "date" : "text"}
                        value={form[key]}
                        onChange={(event) =>
                          updateForm(key, event.target.value)
                        }
                        maxLength={key === "phone_number" ? 15 : undefined}
                      />
                    )
                  ) : (
                    <span>
                      {key === "first_name"
                        ? firstName
                        : key === "last_name"
                          ? surname
                          : key === "email"
                            ? currentUser.email || "Not provided"
                            : key === "member_since"
                              ? dateJoined
                              : key === "gender"
                                ? genderLabels[form.gender] || "Not provided"
                                : key === "date_of_birth"
                                  ? form.date_of_birth || "Not provided"
                                  : form[key] || "Not provided"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="profile-social-section">
            <h3>Social Profiles</h3>
            <div className="profile-social-fields">
              {(
                [
                  ["facebook_url", "Facebook profile URL"],
                  ["twitter_url", "X / Twitter profile URL"],
                ] as const
              ).map(([key, label]) => (
                <div className="profile-social-value" key={key}>
                  {isEditing ? (
                    <input
                      className="profile-field-control"
                      type="url"
                      aria-label={label}
                      placeholder={label}
                      value={form[key]}
                      onChange={(event) => updateForm(key, event.target.value)}
                    />
                  ) : form[key] ? (
                    <a href={form[key]} target="_blank" rel="noreferrer">
                      {form[key]}
                    </a>
                  ) : (
                    <span>
                      {key === "facebook_url"
                        ? "facebook.com/"
                        : "twitter.com/"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </form>

      <section
        className="profile-verification"
        aria-labelledby="verification-heading"
      >
        <h2 id="verification-heading">Identity verification Status</h2>
        <div className="profile-verification-fields">
          <div className="profile-field">
            <span className="profile-field-label">KYC Status</span>
            <div className="profile-field-value">
              {details.kyc_status.replaceAll("_", " ")}
            </div>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Uploaded Documents</span>
            <div className="profile-field-value profile-document-list">
              {details.documents.length ? (
                details.documents.map((document) => (
                  <a
                    key={document.id}
                    href={mediaUrl(apiBaseUrl, document.file)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {document.name}
                  </a>
                ))
              ) : (
                <span>Not provided</span>
              )}
            </div>
          </div>
        </div>
        <div className="profile-verification-action">
          <button
            type="button"
            onClick={() => {
              setShowVerificationForm((shown) => !shown);
              setError("");
              setMessage("");
            }}
          >
            {showVerificationForm ? "Cancel" : "Complete verification"}
          </button>
          {details.kyc_status === "pending" && <span>( If Pending )</span>}
        </div>
        {showVerificationForm && (
          <form
            className="profile-verification-upload"
            onSubmit={uploadDocuments}
          >
            <p>
              Upload your RC, PUC, or insurance documents (PDF, JPG, PNG; max 10
              MB each).
            </p>
            <input
              ref={documentsInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              onChange={(event) =>
                setVerificationFiles(Array.from(event.target.files || []))
              }
            />
            <button type="submit" disabled={isUploadingDocuments}>
              {isUploadingDocuments ? "Uploading…" : "Submit documents"}
            </button>
          </form>
        )}
      </section>

      {(message || error) && (
        <p
          className={`profile-feedback${error ? " is-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error || message}
        </p>
      )}
    </main>
  );
}
