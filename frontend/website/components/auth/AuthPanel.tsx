"use client";

import Image from "next/image";
import React from "react";
import { useState, FormEvent, useEffect } from "react";
import AuthForm, {
  BusinessSignupValues,
  IndividualSignupValues,
  LoginFormValues,
} from "./AuthForm";
import { AuthFormValues } from "./AuthForm";
import Link from "next/link";
import { Nunito } from "next/font/google";
import AccountCreated from "./_AccountCreated";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"], // Specify the weights you need
});

type AuthPanelNavProps = { onBack: () => void };

function AuthPanelNav({ onBack }: AuthPanelNavProps) {
  return (
    <div className="auth-panel-nav">
      <div
        className="back-arrow"
        onClick={onBack}
        role="button"
        tabIndex={0}
        aria-label="Go back"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onBack();
          }
        }}
      >
        <Image
          src="/icons/leading-icon.png"
          alt="Back"
          width={34}
          height={34}
        />
      </div>
      <div className="help-btn">Help</div>
    </div>
  );
}

type StepPaginationProps = {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
};

function StepPagination({
  currentStep,
  totalSteps,
  onStepChange,
}: StepPaginationProps) {
  return (
    <>
      <div className="step-pagination">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <React.Fragment key={step}>
              <div
                className={`step ${isActive ? "active" : ""} ${
                  isCompleted ? "completed" : ""
                }`}
                // onClick={() => onStepChange?.(step)}
                aria-current={isActive ? "step" : undefined}
              >
                {step < currentStep ? "\u2713" : step}
              </div>

              {step < totalSteps && (
                <div
                  className={`step-line ${
                    step < currentStep ? "completed" : ""
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}
type UserType = "individual" | "business";

function StepBanner({
  currentStep,
  user,
}: {
  currentStep: number;
  user: UserType;
}) {
  const stepMessages = {
    individual: [
      "Create Account",
      "What do you want to do?",
      "Let's Personalize things a bit more",
    ],
    business: [
      "Create Business Account",
      "What do you want to do?",
      "Let's verify your business",
      "Add Business info",
    ],
  };

  return (
    <div className="step-banner">
      {currentStep === 1 && <h2>Let's create your Pitstop account</h2>}
      <h1>{stepMessages[user][currentStep - 1]}</h1>
    </div>
  );
}

type AuthPanelProps = {
  mode: "signup" | "login";
  user: "individual" | "business";
};

export default function AuthPanel({ mode, user }: AuthPanelProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [accountCreated, setAccountCreated] = useState(false);
  const [signupUserType, setSignupUserType] = useState<
    "individual" | "business" | null
  >(null);

  useEffect(() => {
    const authStory = document.querySelector(
      ".auth-story",
    ) as HTMLElement | null;

    if (!authStory) return;

    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const updateAuthStory = () => {
      if (mobileQuery.matches && signupUserType !== null) {
        authStory.style.display = "none";
      } else {
        authStory.style.display = "";
      }
    };

    updateAuthStory();

    mobileQuery.addEventListener("change", updateAuthStory);

    return () => {
      mobileQuery.removeEventListener("change", updateAuthStory);
      authStory.style.display = "";
    };
  }, [signupUserType]);

  const loginInitialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const individualSignupInitialValues: IndividualSignupValues = {
    email: "",
    username: "",
    contact_person_name: "",
    password: "",
    passwordConfirm: "", // Frontend-only
    phone_number: "",
    phone_verification_challenge_id: "",
    phone_verification_token: "",
    email_verification_challenge_id: "",
    email_verification_token: "",
    purpose: "",
    preferred_location: "",
    vehicle_make: "",
    profile_picture: null,
    terms_and_conditions_accepted: false,
  };

  const businessSignupInitialValues: BusinessSignupValues = {
    business_name: "",
    username: "",
    contact_person_name: "",
    email: "",
    password: "",
    passwordConfirm: "", // Frontend-only

    purposes: [],

    trade_license_number: "",
    vat_gst_number: "",

    profile_picture: null,

    business_address: "",
    operating_hours: "",
    services_offered: "",

    contact_number: "",
    phone_verification_challenge_id: "",
    phone_verification_token: "",
    email_verification_challenge_id: "",
    email_verification_token: "",

    // garage_photos: [],

    type_of_vehicles_serviced: "",

    terms_and_conditions_accepted: false,
  };

  const [formValues, setFormValues] = useState<
    LoginFormValues | IndividualSignupValues | BusinessSignupValues
  >(() => {
    if (mode === "login") {
      return loginInitialValues;
    }

    return individualSignupInitialValues;
  });

  const handleChange = <K extends keyof AuthFormValues>(
    field: K,
    value: AuthFormValues[K],
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => Math.max(1, prevStep - 1));
  };

  return (
    <div className="auth-panel-css">
      {mode === "login" ? (
        <AuthForm
          mode="login"
          user={user}
          values={formValues}
          onChange={handleChange}
        />
      ) : signupUserType === null ? (
        <div className="user-type-option">
          <h2>How would you like to use Pitstop?</h2>
          <h4 className={nunito.className}>REGISTER AS</h4>

          <button
            className={nunito.className}
            onClick={() => {
              setSignupUserType("individual");
              setFormValues(individualSignupInitialValues);
            }}
          >
            Individual
          </button>

          <button
            className={nunito.className}
            onClick={() => {
              setSignupUserType("business");
              setFormValues(businessSignupInitialValues);
            }}
          >
            Business Owner
          </button>
          <div>
            <span>Already have an account?</span>

            <span className="link">
              <Link href={"/login"}> Login</Link>
            </span>
          </div>
        </div>
      ) : accountCreated && mode === "signup" ? (
        <AccountCreated
          user={signupUserType}
          username={
            (formValues as IndividualSignupValues | BusinessSignupValues)
              .username
          }
        />
      ) : (
        <>
          <AuthPanelNav onBack={handleBack} />
          <StepPagination
            currentStep={currentStep}
            totalSteps={signupUserType === "individual" ? 3 : 4}
            onStepChange={setCurrentStep}
          />
          <StepBanner currentStep={currentStep} user={signupUserType} />
          {signupUserType === "individual" && (
            <AuthForm
              mode="signup"
              user="individual"
              currentStep={currentStep}
              totalSteps={3}
              onCurrentStepChange={setCurrentStep}
              values={formValues as IndividualSignupValues}
              onChange={handleChange as any}
              setAccountCreated={setAccountCreated}
            />
          )}
          {signupUserType === "business" && (
            <AuthForm
              mode="signup"
              user="business"
              currentStep={currentStep}
              totalSteps={4}
              onCurrentStepChange={setCurrentStep}
              values={formValues as BusinessSignupValues}
              onChange={handleChange as any}
              setAccountCreated={setAccountCreated}
            />
          )}
        </>
      )}
    </div>
  );
}
