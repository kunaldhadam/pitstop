import React from "react";
import Image from "next/image";

type AccountCreatedProps = {
  user: "individual" | "business" | null;
  username: string;
};

export default function AccountCreated({
  username,
  user,
}: AccountCreatedProps) {
  return (
    <div className="account-created-screen">
      <div></div>
      <div>
        {user === "individual" ? (
          <>
            <h1>Welcome to Pitstop, {username}!</h1>
            <h2>
               "You’re all set. Explore the dashboard, post listings, or book
              services right away."
            </h2>
          </>
        ) : (
          <>
            <h1>Thank you for Registering!</h1>
            <h2>
                "You’re all set. Head to your dashboard to manage listings,
              bookings, and grow your business."
            </h2>
          </>
        )}
        <Image
          src="/welcome-image.svg"
          alt="account-created-image"
          height={500}
          width={500}
        />
      </div>
      <div className="absolute-button">
        <a href="/login">
          <button type="button">Go to Login</button>
        </a>
      </div>
    </div>
  );
}
