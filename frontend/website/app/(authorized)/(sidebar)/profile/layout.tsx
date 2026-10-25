"use client";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProfileLayout from "@/components/profile/ProfileLayout";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProfileUser } from "@/components/profile/ProfileDetails";

const emptyUser: ProfileUser = {
  username: "Guest User",
  email: "guest@pitstop.app",
  phone_number: "Not provided",
  contact_person_name: "Not provided",
  usertype: "Individual",
  individual_profile: {
    purpose: "Not provided",
    preferred_location: "Not provided",
    vehicle_make: "Not provided",
    profile_picture: null,
  },
};

const mediaUrl = (apiBaseUrl: string, path: string) =>
  /^https?:\/\//i.test(path) ? path : `${apiBaseUrl}${path}`;

const getRandomPastelGradient = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 35 + Math.random() * 20;
  const lightness1 = 25 + Math.random() * 10;
  const lightness2 = lightness1 + 5 + Math.random() * 8;

  return `linear-gradient(
    215deg,
    hsl(${hue}, ${saturation}%, ${lightness1}%),
    hsl(${hue}, ${saturation + 5}%, ${lightness2}%),
    hsl(${hue}, ${saturation + 25}%, ${lightness2}%),
    hsl(${hue}, ${saturation + 75}%, ${lightness2}%)
  )`;
};

// export const metadata: Metadata = {
//   title: {
//     default: "My Profile",
//     template: "%s | Pitstop",
//   },
// };

export default function ProfileRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const showProfileNav = pathname !== "/profile";
  const [user, setUser] = useState<ProfileUser>(emptyUser);
  const [avatarGradient, setAvatarGradient] = useState("");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setAvatarGradient(getRandomPastelGradient());
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!apiBaseUrl) {
        setUser(emptyUser);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/accounts/me/`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load profile data");
        }

        const data: ProfileUser = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setUser(emptyUser);
      }
    };

    fetchUserData();
  }, [apiBaseUrl]);

  const profilePicture = user.individual_profile?.profile_picture
    ? mediaUrl(apiBaseUrl, user.individual_profile.profile_picture)
    : user.garage_owner_profile?.profile_picture
      ? mediaUrl(apiBaseUrl, user.garage_owner_profile.profile_picture)
      : null;

  const profileImage = profilePicture
    ? /^https?:\/\//i.test(profilePicture)
      ? profilePicture
      : `${apiBaseUrl.replace(/\/+$/, "")}/${profilePicture.replace(/^\/+/, "")}`
    : null;
  return (
    <>
      <div className="profile_nav">
        <Link href="/" aria-label="Home">
          <div className="website_logo">
            <Image
              src="/icons/profile_icons/website_icon.svg"
              height={25}
              width={25}
              alt="website logo"
            />
          </div>
        </Link>

        <div className="profile_nav_links">
          <Link href="/profile/search" aria-label="Search profile">
            <svg
              width="25"
              height="25"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.875 21.875L17.3438 17.3438M19.7917 11.4583C19.7917 16.0607 16.0607 19.7917 11.4583 19.7917C6.85596 19.7917 3.125 16.0607 3.125 11.4583C3.125 6.85596 6.85596 3.125 11.4583 3.125C16.0607 3.125 19.7917 6.85596 19.7917 11.4583Z"
                stroke="#7b7b7b"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <Link href="/profile/settings" aria-label="Profile settings">
            <svg
              width="25"
              height="25"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.0028 14.3494C13.2988 14.3494 14.3494 13.2988 14.3494 12.0028C14.3494 10.7069 13.2988 9.65625 12.0028 9.65625C10.7069 9.65625 9.65625 10.7069 9.65625 12.0028C9.65625 13.2988 10.7069 14.3494 12.0028 14.3494Z"
                stroke="#7b7b7b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.0545 14.4545C17.9456 14.7013 17.9131 14.9751 17.9613 15.2405C18.0094 15.5059 18.1359 15.7508 18.3245 15.9436L18.3736 15.9927C18.5258 16.1447 18.6465 16.3252 18.7288 16.5238C18.8112 16.7225 18.8536 16.9354 18.8536 17.1505C18.8536 17.3655 18.8112 17.5784 18.7288 17.7771C18.6465 17.9757 18.5258 18.1562 18.3736 18.3082C18.2217 18.4603 18.0412 18.581 17.8425 18.6634C17.6439 18.7457 17.431 18.7881 17.2159 18.7881C17.0009 18.7881 16.7879 18.7457 16.5893 18.6634C16.3906 18.581 16.2102 18.4602 16.0582 18.3082L16.0091 18.2591C15.8163 18.0705 15.5714 17.9439 15.3059 17.8958C15.0405 17.8477 14.7668 17.8802 14.52 17.9891C14.278 18.0928 14.0716 18.265 13.9263 18.4845C13.7809 18.704 13.7029 18.9613 13.7018 19.2245V19.3636C13.7018 19.7976 13.5294 20.2138 13.2225 20.5207C12.9157 20.8276 12.4994 21 12.0655 21C11.6315 21 11.2152 20.8276 10.9084 20.5207C10.6015 20.2138 10.4291 19.7976 10.4291 19.3636V19.29C10.4228 19.0192 10.3351 18.7565 10.1775 18.5362C10.0199 18.3159 9.79969 18.1481 9.54545 18.0545C9.29868 17.9456 9.02493 17.9131 8.75952 17.9613C8.4941 18.0094 8.24919 18.1359 8.05636 18.3245L8.00727 18.3736C7.8553 18.5258 7.67483 18.6465 7.47617 18.7288C7.27752 18.8112 7.06459 18.8536 6.84955 18.8536C6.6345 18.8536 6.42157 18.8112 6.22292 18.7288C6.02426 18.6465 5.84379 18.5258 5.69182 18.3736C5.53967 18.2217 5.41898 18.0412 5.33663 17.8425C5.25428 17.6439 5.21189 17.431 5.21189 17.2159C5.21189 17.0009 5.25428 16.7879 5.33663 16.5893C5.41898 16.3906 5.53967 16.2102 5.69182 16.0582L5.74091 16.0091C5.92953 15.8163 6.05606 15.5714 6.10419 15.3059C6.15231 15.0405 6.11982 14.7668 6.01091 14.52C5.90719 14.278 5.73498 14.0716 5.51547 13.9263C5.29596 13.7809 5.03873 13.7029 4.77545 13.7018H4.63636C4.20237 13.7018 3.78616 13.5294 3.47928 13.2225C3.1724 12.9157 3 12.4999 3 12.0659C3 11.6319 3.1724 11.2157 3.47928 10.9089C3.78616 10.602 4.20237 10.4296 4.63636 10.4296H4.71C4.98081 10.4233 5.24346 10.3356 5.46379 10.178C5.68412 10.0204 5.85195 9.80019 5.94545 9.54595C6.05437 9.29918 6.08686 9.02543 6.03873 8.76002C5.99061 8.4946 5.86408 8.24969 5.67545 8.05686L5.62636 8.00777C5.47422 7.8558 5.35352 7.67533 5.27118 7.47667C5.18883 7.27802 5.14644 7.06509 5.14644 6.85005C5.14644 6.635 5.18883 6.42207 5.27118 6.22342C5.35352 6.02476 5.47422 5.84429 5.62636 5.69232C5.77834 5.54017 5.95881 5.41948 6.15746 5.33713C6.35611 5.25478 6.56905 5.21239 6.78409 5.21239C6.99913 5.21239 7.21207 5.25478 7.41072 5.33713C7.60937 5.41948 7.78984 5.54017 7.94182 5.69232L7.99091 5.74141C8.18374 5.93003 8.42865 6.05656 8.69406 6.10469C8.95948 6.15281 9.23322 6.12032 9.48 6.01141H9.54545C9.78745 5.90769 9.99383 5.73548 10.1392 5.51597C10.2846 5.29646 10.3626 5.03923 10.3636 4.77595V4.63636C10.3636 4.20237 10.536 3.78616 10.8429 3.47928C11.1498 3.1724 11.566 3 12 3C12.434 3 12.8502 3.1724 13.1571 3.47928C13.464 3.78616 13.6364 4.20237 13.6364 4.63636V4.71C13.6374 4.97328 13.7154 5.23051 13.8608 5.45002C14.0062 5.66953 14.2126 5.84174 14.4545 5.94545C14.7013 6.05437 14.9751 6.08686 15.2405 6.03873C15.5059 5.99061 15.7508 5.86408 15.9436 5.67545L15.9927 5.62636C16.1447 5.47422 16.3252 5.35352 16.5238 5.27118C16.7225 5.18883 16.9354 5.14644 17.1505 5.14644C17.3655 5.14644 17.5784 5.18883 17.7771 5.27118C17.9757 5.35352 18.1562 5.47422 18.3082 5.62636C18.4603 5.77834 18.581 5.95881 18.6634 6.15746C18.7457 6.35611 18.7881 6.56905 18.7881 6.78409C18.7881 6.99913 18.7457 7.21207 18.6634 7.41072C18.5704 7.6344 18.3803 7.8128 18.15 7.9"
                stroke="#7b7b7b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <Link href="/profile/notifications" aria-label="Notifications">
            <Image
              src="/icons/profile_icons/notification_icon.svg"
              height={24}
              width={24}
              alt="notifications icon"
            />
          </Link>

          <div className="profile_photo_container">
            <Link
              className="profile_photo_holder"
              href="/profile/profile_photo"
            >
              {profileImage ? (
                <Image
                  className="profile_photo_icon"
                  src={profileImage}
                  width={96}
                  height={96}
                  alt="profile photo icon"
                  unoptimized
                />
              ) : (
                <div
                  className="profile_photo_icon"
                  style={{ background: avatarGradient }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <Link className="username_role" href="/profile">
              <span className="username">{user.username}</span>
              <span className="role">
                {user.usertype
                  ? user.usertype.charAt(0).toUpperCase() +
                    user.usertype.slice(1)
                  : "User"}
              </span>
            </Link>
            <div className="more-icon" aria-label="More actions">
              <Image
                src="/icons/leading-icon.png"
                height={24}
                width={24}
                alt="more icon"
              />
            </div>
          </div>
        </div>
      </div>
      <ProfileLayout>{children}</ProfileLayout>;
    </>
  );
}
