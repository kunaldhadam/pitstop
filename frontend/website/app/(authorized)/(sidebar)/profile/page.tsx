"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProfileDetails, {
  type ProfileUser,
} from "@/components/profile/ProfileDetails";

const emptyUser: ProfileUser = {
  username: "Guest User",
  first_name: "",
  last_name: "",
  email: "guest@pitstop.app",
  phone_number: "Not provided",
  contact_person_name: "Not provided",
  usertype: "None",
  date_joined: "",
  profile_details: {
    street_address: "",
    date_of_birth: null,
    gender: "",
    facebook_url: "",
    twitter_url: "",
    kyc_status: "pending",
    documents: [],
  },
  individual_profile: {
    purpose: "Not provided",
    preferred_location: "Not provided",
    vehicle_make: "Not provided",
    profile_picture: null,
  },
};
const getRandomPastelGradient = () => {
  const hue = Math.floor(Math.random() * 360);

  const saturation = 35 + Math.random() * 20; // 35–55%
  const lightness1 = 25 + Math.random() * 10; // 25–35%
  const lightness2 = lightness1 + 5 + Math.random() * 8;

  return `linear-gradient(
    215deg,
    hsl(${hue}, ${saturation}%, ${lightness1}%),
    hsl(${hue}, ${saturation + 5}%, ${lightness2}%),
    hsl(${hue}, ${saturation + 25}%, ${lightness2}%),
    hsl(${hue}, ${saturation + 75}%, ${lightness2}%)
  )`;
};

const mediaUrl = (apiBaseUrl: string, path: string) =>
  /^https?:\/\//i.test(path) ? path : `${apiBaseUrl}${path}`;

export default function ProfilePage() {
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
        console.error("Error fetching user data:", error);
        setUser(emptyUser);
      }
    };

    fetchUserData();
  }, [apiBaseUrl]);

  const profileUser = user ?? emptyUser;
  const handleUserUpdated = useCallback((updatedUser: ProfileUser) => {
    setUser(updatedUser);
  }, []);

  const profilePicture = user.individual_profile?.profile_picture
    ? mediaUrl(apiBaseUrl, user.individual_profile.profile_picture)
    : user.garage_owner_profile?.profile_picture
      ? mediaUrl(apiBaseUrl, user.garage_owner_profile.profile_picture)
      : null;

  const profileImage = profilePicture
    ? /^https?:\/\//i.test(profilePicture)
      ? profilePicture
      : `${apiBaseUrl}${profilePicture}`
    : null;

  return (
    <>
      <div className="p-[29px_34px]">
        <div className="profile-container">
          <ProfileDetails
            user={profileUser}
            apiBaseUrl={apiBaseUrl}
            onUserUpdated={handleUserUpdated}
          />
        </div>
      </div>
    </>
  );
}
