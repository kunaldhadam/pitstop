import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Credits from "@/components/profile/sections/Credits";
import Documents from "@/components/profile/sections/Documents";
import Help from "@/components/profile/sections/Help";
import MyListings from "@/components/profile/sections/MyListings";
import Overview from "@/components/profile/sections/Overview";
import Report from "@/components/profile/sections/Report";
import Settings from "@/components/profile/sections/Settings";
import Wallet from "@/components/profile/sections/Wallet";

const sectionComponents = {
  overview: Overview,
  "my-listings": MyListings,
  report: Report,
  wallet: Wallet,
  credits: Credits,
  documents: Documents,
  settings: Settings,
  help: Help,
};

type ProfileSection = keyof typeof sectionComponents;

const sectionTitles: Record<ProfileSection, string> = {
  overview: "Overview",
  "my-listings": "My Listings",
  report: "Report",
  wallet: "Wallet",
  credits: "Credits",
  documents: "Documents",
  settings: "Settings",
  help: "Help",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;

  return {
    title:
      Object.hasOwn(sectionTitles, section) ?
        sectionTitles[section as ProfileSection] :
        "Profile",
  };
}

export default async function ProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!Object.hasOwn(sectionComponents, section)) {
    notFound();
  }

  const Section = sectionComponents[section as ProfileSection];

  return (
    <div className="profile-container">
      <Section />
    </div>
  );
}
