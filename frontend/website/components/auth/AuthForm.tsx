"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import { Nunito } from "next/font/google";
import { validateField, validateForm } from "@/lib/auth/form_validation";
import { postToApi } from "@/lib/allauth";
import { useRouter } from "next/navigation";

const APIUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"], // Specify the weights you need
});

type FormFieldProps = {
  label: string;
  name: string;
  type: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  error_msg?: string;
  pattern?: string;
  onBlur?: () => void;
  inputMode?: "numeric" | "text";
  readOnly?: boolean;
};

function FormField({
  type,
  name,
  value,
  placeholder,
  autoComplete,
  minLength,
  required = false,
  error_msg,
  onChange,
  pattern,
  maxLength,
  onBlur,
  inputMode,
  readOnly,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <label className={nunito.className}>
      <div className={type === "password" ? "password-field" : ""}>
        <input
          type={inputType}
          value={value}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={`${placeholder}${required ? " *" : ""}`}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          readOnly={readOnly}
          aria-invalid={!!error_msg}
          aria-describedby={error_msg ? `${name}-error` : undefined}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="password-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <Image
                src={"/icons/eye-show.svg"}
                width={20}
                height={20}
                alt="hide"
              />
            ) : (
              <Image
                src={"/icons/eye-off.svg"}
                width={20}
                height={20}
                alt="hide"
              />
            )}
          </button>
        )}
      </div>
      <span id={`${name}-error`} className="error-msg" role="alert">
        {error_msg}
      </span>
    </label>
  );
}

type PhoneVerificationFieldProps = {
  value: string;
  challengeId: string;
  verificationToken: string;
  onPhoneChange: (value: string) => void;
  onVerificationChange: (challengeId: string, token: string) => void;
};

function PhoneVerificationField({
  value,
  challengeId,
  verificationToken,
  onPhoneChange,
  onVerificationChange,
}: PhoneVerificationFieldProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeNumber = () => {
    onVerificationChange("", "");
    setOtp("");
    setError("");
  };

  const sendCode = async () => {
    const validationError = validateField("phone", value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await postToApi("/api/accounts/phone/send-otp/", {
        phone_number: value,
      });
      onVerificationChange(response.challenge_id, "");
    } catch (requestError) {
      setError(
        typeof requestError === "object" &&
          requestError !== null &&
          "detail" in requestError &&
          typeof requestError.detail === "string"
          ? requestError.detail
          : "Unable to send a code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await postToApi("/api/accounts/phone/verify-otp/", {
        phone_number: value,
        challenge_id: challengeId,
        otp,
      });
      onVerificationChange(challengeId, response.verification_token);
    } catch (requestError) {
      setError(
        typeof requestError === "object" &&
          requestError !== null &&
          "detail" in requestError &&
          typeof requestError.detail === "string"
          ? requestError.detail
          : "The code could not be verified. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="otp-verification">
      {verificationToken ? (
        <>
          <FormField
            label="Phone"
            type="tel"
            name="phone"
            value={value}
            placeholder="Phone Number"
            autoComplete="tel"
            readOnly
            onChange={() => undefined}
          />
          <div className="otp-verification-actions">
            <span className="otp-verification-status" role="status">
              Phone number verified
            </span>
            <button type="button" onClick={changeNumber}>
              Change number
            </button>
          </div>
        </>
      ) : challengeId ? (
        <>
          <FormField
            label="Verification code"
            type="text"
            name="phone_otp"
            value={otp}
            placeholder="6-digit code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            required
            error_msg={error}
            onChange={(code) => {
              setOtp(code.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
          />
          <div className="otp-verification-actions">
            <button type="button" onClick={verifyCode} disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" onClick={changeNumber}>
              Change number
            </button>
          </div>
        </>
      ) : (
        <>
          <FormField
            label="Phone"
            type="tel"
            name="phone"
            value={value}
            placeholder="Phone Number"
            autoComplete="tel"
            required
            inputMode="numeric"
            error_msg={error}
            onChange={(phone) => {
              onPhoneChange(phone);
              setError("");
            }}
          />
          <div className="otp-verification-actions">
            <button type="button" onClick={sendCode} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type EmailVerificationFieldProps = {
  value: string;
  challengeId: string;
  verificationToken: string;
  onEmailChange: (value: string) => void;
  onVerificationChange: (challengeId: string, token: string) => void;
};

function EmailVerificationField({
  value,
  challengeId,
  verificationToken,
  onEmailChange,
  onVerificationChange,
}: EmailVerificationFieldProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeEmail = () => {
    onVerificationChange("", "");
    setOtp("");
    setError("");
  };

  const sendCode = async () => {
    const validationError = validateField("email", value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await postToApi("/api/accounts/email/send-otp/", {
        email: value,
      });
      onVerificationChange(response.challenge_id, "");
    } catch (requestError) {
      const message =
        typeof requestError === "object" && requestError !== null
          ? "detail" in requestError && typeof requestError.detail === "string"
            ? requestError.detail
            : "email" in requestError && typeof requestError.email === "string"
              ? requestError.email
              : "Unable to send a code. Please try again."
          : "Unable to send a code. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await postToApi("/api/accounts/email/verify-otp/", {
        email: value,
        challenge_id: challengeId,
        otp,
      });
      onVerificationChange(challengeId, response.verification_token);
    } catch (requestError) {
      const message =
        typeof requestError === "object" &&
        requestError !== null &&
        "detail" in requestError &&
        typeof requestError.detail === "string"
          ? requestError.detail
          : "The code could not be verified. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="otp-verification">
      {verificationToken ? (
        <>
          <FormField
            label="Email"
            type="email"
            name="email"
            value={value}
            placeholder="Email"
            autoComplete="email"
            readOnly
            onChange={() => undefined}
          />
          <div className="otp-verification-actions">
            <span className="otp-verification-status" role="status">
              Email address verified
            </span>
            <button type="button" onClick={changeEmail}>
              Change email
            </button>
          </div>
        </>
      ) : challengeId ? (
        <>
          <FormField
            label="Verification code"
            type="text"
            name="email_otp"
            value={otp}
            placeholder="6-digit code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            required
            error_msg={error}
            onChange={(code) => {
              setOtp(code.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
          />
          <div className="otp-verification-actions">
            <button type="button" onClick={verifyCode} disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify code"}
            </button>
            <button type="button" onClick={changeEmail}>
              Change email
            </button>
          </div>
        </>
      ) : (
        <>
          <FormField
            label="Email"
            type="email"
            name="email"
            value={value}
            placeholder="Email"
            autoComplete="email"
            required
            error_msg={error}
            onChange={(email) => {
              onEmailChange(email);
              setError("");
            }}
          />
          <div className="otp-verification-actions">
            <button type="button" onClick={sendCode} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send code"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export type LoginFormValues = {
  email: string;
  password: string;
};

export type IndividualSignupValues = {
  email: string;
  username: string;
  contact_person_name: string;
  password: string;
  passwordConfirm: string;
  phone_number: string;
  phone_verification_challenge_id: string;
  phone_verification_token: string;
  email_verification_challenge_id: string;
  email_verification_token: string;
  purpose: string;
  preferred_location: string;
  vehicle_make: string;
  profile_picture: File | null;
  terms_and_conditions_accepted: boolean;
};

export type BusinessSignupValues = {
  business_name: string;
  username: string;
  contact_person_name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  purposes: number[];
  trade_license_number: string;
  vat_gst_number: string;
  profile_picture: File | null;
  business_address: string;
  operating_hours: string;
  services_offered: string;
  contact_number: string;
  phone_verification_challenge_id: string;
  phone_verification_token: string;
  email_verification_challenge_id: string;
  email_verification_token: string;
  // garage_photos: File[];
  type_of_vehicles_serviced: string;
  terms_and_conditions_accepted: boolean;
};

export type AuthFormValues =
  | LoginFormValues
  | IndividualSignupValues
  | BusinessSignupValues;

type CommonAuthFormProps = {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

type AuthFormProps =
  | (CommonAuthFormProps & {
      mode: "login";
      user: "individual" | "business";
      values: LoginFormValues;
      onChange: <K extends keyof LoginFormValues>(
        field: K,
        value: LoginFormValues[K],
      ) => void;
    })
  | (CommonAuthFormProps & {
      mode: "signup";
      user: "individual";
      setAccountCreated: React.Dispatch<React.SetStateAction<boolean>>;
      values: IndividualSignupValues;
      currentStep: number;
      totalSteps: number;
      onCurrentStepChange: (step: number) => void;
      onChange: <K extends keyof IndividualSignupValues>(
        field: K,
        value: IndividualSignupValues[K],
      ) => void;
    })
  | (CommonAuthFormProps & {
      mode: "signup";
      user: "business";
      setAccountCreated: React.Dispatch<React.SetStateAction<boolean>>;
      values: BusinessSignupValues;
      currentStep: number;
      totalSteps: number;
      onCurrentStepChange: (step: number) => void;
      onChange: <K extends keyof BusinessSignupValues>(
        field: K,
        value: BusinessSignupValues[K],
      ) => void;
    });

type Purpose = {
  id: number;
  name: string;
};

export default function AuthForm(props: AuthFormProps) {
  const { mode, user, values, onChange } = props;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const router = useRouter();

  if (mode === "signup") {
    // TypeScript knows these exist here
    props.currentStep;
    props.totalSteps;
    props.onCurrentStepChange;
  }

  useEffect(() => {
    fetch(`${APIUrl}/api/accounts/business/`)
      .then((res) => res.json())
      .then((data) => setPurposes(data));
  }, []);

  const handleBlur = async (name: string, value: string) => {
    let message = validateField(name, value);

    if (name === "username" && !message) {
      const response = await fetch(
        `${APIUrl}/api/accounts/check-username/?username=${value}`,
      );

      const data = await response.json();

      if (data.not_available) {
        message = "This username is already taken";
      }
    }

    // if (name === "phone" && !message){

    // }

    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }));
  };

  const profilePicture =
    mode === "signup" && "profile_picture" in values
      ? values.profile_picture
      : null;

  const passwordMismatch =
    mode === "signup" &&
    "passwordConfirm" in values &&
    values.passwordConfirm.length > 0 &&
    values.password !== values.passwordConfirm;

  useEffect(() => {
    if (!profilePicture) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(profilePicture);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signup") {
      // Validate password only on step 1
      if (
        props.currentStep === 1 &&
        "passwordConfirm" in values &&
        values.password !== values.passwordConfirm
      ) {
        alert("Passwords do not match.");
        return;
      }
      // Move to next step

      if (props.currentStep < props.totalSteps) {
        if (props.currentStep === 1 && !values.email_verification_token) {
          setGeneralError("Verify your email address to continue.");
          return;
        }
        if (
          user === "individual" &&
          props.currentStep === 1 &&
          !values.phone_verification_token
        ) {
          setGeneralError("Verify your phone number to continue.");
          return;
        }
        props.onCurrentStepChange(props.currentStep + 1);
        return;
      }

      if (
        !values.email_verification_token ||
        !values.phone_verification_token
      ) {
        setGeneralError(
          "Verify your email address and phone number before creating your account.",
        );
        return;
      }
      // Validate terms and conditions

      if (
        !("terms_and_conditions_accepted" in values) ||
        !values.terms_and_conditions_accepted
      ) {
        alert("Please accept the terms and conditions.");
        return;
      }

      const error = validateForm({
        email: values.email,
        password: values.password,
      });

      setErrors(error);

      if (Object.keys(error).length > 0) return;

      try {
        let payload: Record<string, any> = {};
        let profilePicture: File | null = null;

        if (user === "individual") {
          profilePicture = values.profile_picture;
          payload = {
            username: values.username,
            email: values.email,
            email_verification_challenge_id:
              values.email_verification_challenge_id,
            email_verification_token: values.email_verification_token,
            contact_person_name: values.contact_person_name,
            password: values.password,
            phone_number: values.phone_number,
            phone_verification_challenge_id:
              values.phone_verification_challenge_id,
            phone_verification_token: values.phone_verification_token,
            usertype: "individual",
            individual_profile: {
              purpose: values.purpose,
              preferred_location: values.preferred_location,
              vehicle_make: values.vehicle_make,
              terms_and_conditions_accepted:
                values.terms_and_conditions_accepted,
            },
          };
        } else if (user === "business") {
          profilePicture = values.profile_picture;
          payload = {
            username: values.username,
            email: values.email,
            email_verification_challenge_id:
              values.email_verification_challenge_id,
            email_verification_token: values.email_verification_token,
            contact_person_name: values.contact_person_name,
            password: values.password,
            usertype: "garage owner",
            phone_number: values.contact_number,
            phone_verification_challenge_id:
              values.phone_verification_challenge_id,
            phone_verification_token: values.phone_verification_token,
            garage_owner_profile: {
              business_name: values.business_name,
              purposes: values.purposes,
              trade_license_number: values.trade_license_number,
              vat_gst_number: values.vat_gst_number,
              business_address: values.business_address,
              operating_hours: values.operating_hours,
              services_offered: values.services_offered,
              type_of_vehicles_serviced: values.type_of_vehicles_serviced,
              terms_and_conditions_accepted:
                values.terms_and_conditions_accepted,
            },
          };
        }

        const formData = new FormData();
        // Send all normal/nested data as JSON

        formData.append("data", JSON.stringify(payload));
        // Send image separately
        if (profilePicture) {
          formData.append("profile_picture", profilePicture);
        }

        const data = await postToApi("/api/accounts/register/", formData);

        if (data) {
          props.setAccountCreated(true);
        }
      } catch (error: any) {
        if (error.email) {
          setGeneralError(error.email[0]);

          setTimeout(() => {
            setGeneralError("");
          }, 3000);

          return;
        }
        alert(error instanceof Error ? error.message : "Signup failed.");
      }
      return;
    }
    if (mode === "login") {
      const error = validateForm({
        email: values.email,
        password: values.password,
      });

      setErrors(error);

      if (Object.keys(error).length > 0) return;

      try {
        await postToApi("/_allauth/browser/v1/auth/login", values);
        router.replace("/");
      } catch (error) {
        setGeneralError("Invalid email or password.");

        setTimeout(() => {
          setGeneralError("");
        }, 3000);
      }
      return;
    }
  }

  return (
    <div className="block-form">
      {generalError && (
        <div className="general_error">
          <span>
            <Image
              src="/icons/error-64.png"
              width={20}
              height={20}
              alt="Error icon"
            />
          </span>
          <span>{generalError}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "signup" && user === "individual" ? (
          <>
            <div className="form-fields">
              {props.currentStep === 1 && (
                <>
                  <FormField
                    label="Username"
                    type="text"
                    name="username"
                    value={values.username}
                    placeholder="Username"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("username", value)}
                    error_msg={errors.username}
                    onBlur={() => handleBlur("username", values.username)}
                  />

                  <EmailVerificationField
                    value={values.email}
                    challengeId={values.email_verification_challenge_id}
                    verificationToken={values.email_verification_token}
                    onEmailChange={(value) => {
                      onChange("email", value);
                      onChange("email_verification_challenge_id", "");
                      onChange("email_verification_token", "");
                      setGeneralError("");
                    }}
                    onVerificationChange={(challengeId, token) => {
                      onChange("email_verification_challenge_id", challengeId);
                      onChange("email_verification_token", token);
                      setGeneralError("");
                    }}
                  />

                  <FormField
                    label="Password"
                    type="password"
                    name="password"
                    value={values.password}
                    placeholder="Password"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("password", value)}
                    error_msg={errors.password}
                    onBlur={() => handleBlur("password", values.password)}
                  />

                  <FormField
                    label="Confirm Password"
                    type="password"
                    name="passwordConfirm"
                    value={values.passwordConfirm}
                    placeholder="Confirm Password"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("passwordConfirm", value)}
                    error_msg={passwordMismatch ? "Passwords do not match" : ""}
                  />

                  <FormField
                    label="Contact Person Name"
                    type="text"
                    name="contact_person_name"
                    value={values.contact_person_name}
                    placeholder="Contact Person Name"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("contact_person_name", value)}
                  />

                  <PhoneVerificationField
                    value={values.phone_number}
                    challengeId={values.phone_verification_challenge_id}
                    verificationToken={values.phone_verification_token}
                    onPhoneChange={(value) => {
                      onChange("phone_number", value);
                      onChange("phone_verification_challenge_id", "");
                      onChange("phone_verification_token", "");
                      setGeneralError("");
                    }}
                    onVerificationChange={(challengeId, token) => {
                      onChange("phone_verification_challenge_id", challengeId);
                      onChange("phone_verification_token", token);
                    }}
                  />
                </>
              )}

              {props.currentStep === 2 && (
                <div className="purpose-options">
                  <label
                    className={`purpose-option ${
                      values.purpose === "sell car" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value="sell car"
                      checked={values.purpose === "sell car"}
                      onChange={(event) =>
                        onChange("purpose", event.target.value)
                      }
                    />

                    <span>Sell Car</span>
                  </label>

                  <label
                    className={`purpose-option ${
                      values.purpose === "sell bike" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value="sell bike"
                      checked={values.purpose === "sell bike"}
                      onChange={(event) =>
                        onChange("purpose", event.target.value)
                      }
                    />

                    <span>Sell Bike</span>
                  </label>
                </div>
              )}

              {props.currentStep === 3 && (
                <>
                  <div className="file-upload-input">
                    <span
                      style={
                        previewUrl
                          ? {
                              color: "green",
                            }
                          : undefined
                      }
                    >
                      {previewUrl
                        ? "Profile picture selected ✓"
                        : "Add Profile Picture"}
                    </span>

                    <label
                      htmlFor="profile-picture"
                      className="file-upload"
                      style={
                        previewUrl
                          ? {
                              backgroundImage: `url(${previewUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <input
                        id="profile-picture"
                        type="file"
                        name="profile_picture"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onChange("profile_picture", file);
                        }}
                      />
                    </label>
                  </div>
                  <FormField
                    label="Preferred Location"
                    type="text"
                    name="preferred_location"
                    value={values.preferred_location}
                    placeholder="Preferred Location"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("preferred_location", value)}
                  />

                  <FormField
                    label="Vehicle Make"
                    type="text"
                    name="vehicle_make"
                    value={values.vehicle_make}
                    placeholder="Vehicle Make"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("vehicle_make", value)}
                  />

                  <label className="tnc-checkbox">
                    <input
                      type="checkbox"
                      checked={values.terms_and_conditions_accepted}
                      onChange={(event) =>
                        onChange(
                          "terms_and_conditions_accepted",
                          event.target.checked,
                        )
                      }
                    />
                    <span>
                      <u>I accept the terms and conditions</u>
                    </span>
                  </label>
                </>
              )}
            </div>

            <div className="absolute-button">
              <button type="submit">
                {props.currentStep === props.totalSteps
                  ? "Create Account"
                  : "Continue"}
              </button>
            </div>
          </>
        ) : mode === "signup" && user === "business" ? (
          <>
            <div className="form-fields">
              {props.currentStep === 1 && (
                <>
                  <FormField
                    label="Business Name"
                    type="text"
                    name="business_name"
                    value={values.business_name}
                    placeholder="Business Name"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("business_name", value)}
                  />
                  <FormField
                    label="Contact Person Name"
                    type="text"
                    name="contact_person_name"
                    value={values.contact_person_name}
                    placeholder="Contact Person Name"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("contact_person_name", value)}
                  />
                  <FormField
                    label="Username"
                    type="text"
                    name="username"
                    value={values.username}
                    placeholder="Username"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("username", value)}
                    error_msg={errors.username}
                    onBlur={() => handleBlur("username", values.username)}
                  />
                  <EmailVerificationField
                    value={values.email}
                    challengeId={values.email_verification_challenge_id}
                    verificationToken={values.email_verification_token}
                    onEmailChange={(value) => {
                      onChange("email", value);
                      onChange("email_verification_challenge_id", "");
                      onChange("email_verification_token", "");
                      setGeneralError("");
                    }}
                    onVerificationChange={(challengeId, token) => {
                      onChange("email_verification_challenge_id", challengeId);
                      onChange("email_verification_token", token);
                      setGeneralError("");
                    }}
                  />
                  <FormField
                    label="Password"
                    type="password"
                    name="password"
                    value={values.password}
                    placeholder="Password"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("password", value)}
                    error_msg={errors.password}
                    onBlur={() => handleBlur("password", values.password)}
                  />
                  <FormField
                    label="Confirm Password"
                    type="password"
                    name="confirm_password"
                    value={values.passwordConfirm}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    required
                    onChange={(value) => onChange("passwordConfirm", value)}
                    error_msg={passwordMismatch ? "Passwords do not match" : ""}
                  />
                </>
              )}

              {props.currentStep === 2 && (
                <>
                  <div className="purpose-options">
                    {purposes.map((purpose) => (
                      <label
                        key={purpose.id}
                        className={`purpose-option ${
                          values.purposes?.includes(purpose.id)
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={purpose.id}
                          checked={
                            values.purposes?.includes(purpose.id) || false
                          }
                          onChange={(event) => {
                            const id = Number(event.target.value);

                            const updatedPurposes = event.target.checked
                              ? [...(values.purposes || []), id]
                              : (values.purposes || []).filter(
                                  (item) => item !== id,
                                );

                            onChange("purposes", updatedPurposes);
                          }}
                        />
                        <span>{purpose.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {props.currentStep === 3 && (
                <>
                  <div className="file-upload-input">
                    <span
                      style={
                        previewUrl
                          ? {
                              color: "green",
                            }
                          : undefined
                      }
                    >
                      {previewUrl
                        ? "Profile picture selected ✓"
                        : "Add Profile Picture"}
                    </span>

                    <label
                      htmlFor="profile-picture"
                      className="file-upload"
                      style={
                        previewUrl
                          ? {
                              backgroundImage: `url(${previewUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <input
                        id="profile-picture"
                        type="file"
                        name="profile_picture"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onChange("profile_picture", file);
                        }}
                      />
                    </label>
                  </div>
                  <FormField
                    label="Trade License"
                    type="text"
                    name="trade_license"
                    value={values.trade_license_number}
                    placeholder="Trade License"
                    autoComplete="location"
                    required
                    onChange={(value) =>
                      onChange("trade_license_number", value)
                    }
                  />

                  <FormField
                    label="Vat / GST Number"
                    type="text"
                    name="vat_number"
                    value={values.vat_gst_number}
                    placeholder="Vat / GST Number"
                    autoComplete="off"
                    required
                    onChange={(value) => onChange("vat_gst_number", value)}
                  />
                </>
              )}

              {props.currentStep === 4 && (
                <>
                  <textarea
                    name="business_address"
                    value={values.business_address}
                    placeholder="Business Address"
                    autoComplete="off"
                    required
                    rows={4}
                    onChange={(e) =>
                      onChange("business_address", e.target.value)
                    }
                    style={{ resize: "vertical" }}
                  />
                  <FormField
                    label="Operating Hours"
                    type="text"
                    name="operating_hours"
                    value={values.operating_hours}
                    placeholder="Operating Hours"
                    autoComplete="off"
                    onChange={(value) => onChange("operating_hours", value)}
                  />
                  <FormField
                    label="Services Offered"
                    type="text"
                    name="services_offered"
                    value={values.services_offered}
                    placeholder="Services Offered - Seperate by comma (,)"
                    autoComplete="off"
                    onChange={(value) => onChange("services_offered", value)}
                  />
                  <PhoneVerificationField
                    value={values.contact_number}
                    challengeId={values.phone_verification_challenge_id}
                    verificationToken={values.phone_verification_token}
                    onPhoneChange={(value) => {
                      onChange("contact_number", value);
                      onChange("phone_verification_challenge_id", "");
                      onChange("phone_verification_token", "");
                      setGeneralError("");
                    }}
                    onVerificationChange={(challengeId, token) => {
                      onChange("phone_verification_challenge_id", challengeId);
                      onChange("phone_verification_token", token);
                    }}
                  />

                  <FormField
                    label="Type of Vehicle"
                    type="text"
                    name="type_of_vehicles_served"
                    value={values.type_of_vehicles_serviced}
                    placeholder="Type of Vehicle you Sell/Repair - Seperate by comma (,)"
                    autoComplete="off"
                    required
                    onChange={(value) =>
                      onChange("type_of_vehicles_serviced", value)
                    }
                  />

                  {/* <MultipleImageUpload
                    value={values.garage_photos ?? []}
                    onChange={(value) => onChange("garage_photos", value)}
                  /> */}

                  <label className="tnc-checkbox">
                    <input
                      type="checkbox"
                      checked={values.terms_and_conditions_accepted}
                      onChange={(event) =>
                        onChange(
                          "terms_and_conditions_accepted",
                          event.target.checked,
                        )
                      }
                    />
                    <span>
                      <a href="">
                        <u>I accept the terms and conditions</u>
                      </a>
                    </span>
                  </label>
                </>
              )}
            </div>

            <div className="absolute-button">
              <button type="submit">
                {props.currentStep === props.totalSteps
                  ? "Create Account"
                  : "Continue"}
              </button>
            </div>
          </>
        ) : mode === "login" ? (
          <div className="login-form">
            <div className="login-options">
              <div>Login as : </div>
              <select defaultValue="Individual">
                <option value="individual">Individual</option>
                <option value="business">Garage Owner</option>
              </select>
            </div>
            <div className="form-fields">
              <h2>Login</h2>
              <FormField
                label="Email"
                name="email"
                type="email"
                value={values.email}
                placeholder="Email"
                autoComplete="email"
                required
                onChange={(value) => onChange("email", value)}
                error_msg={errors.email}
                onBlur={() => handleBlur("email", values.email)}
              />
              <FormField
                label="Password"
                name="password"
                type="password"
                value={values.password}
                placeholder="Password"
                autoComplete="password"
                required
                onChange={(value) => onChange("password", value)}
                error_msg={errors.password}
                onBlur={() => handleBlur("password", values.password)}
              />
              <div>
                <span>Don't have an account?</span>

                <span className="link">
                  <Link href={"/register"}> Register</Link>
                </span>
              </div>
            </div>

            <div className="absolute-button">
              <button type="submit">Login</button>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
