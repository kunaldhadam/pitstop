"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function SideBar() {
  interface MenuItem {
    icon: string;
    name: string;
    url: string;
  }
  const menu_list: MenuItem[] = [
    {
      icon: "Dashboard",
      name: "Overview",
      url: "/overview",
    },
    {
      icon: "Car",
      name: "My Listings",
      url: "/my-listings",
    },
    {
      icon: "fi_file-plus",
      name: "Report",
      url: "/report",
    },
    {
      icon: "fi_briefcase",
      name: "Wallet",
      url: "/wallet",
    },
    {
      icon: "fi_database",
      name: "Credits",
      url: "/credits",
    },
    {
      icon: "fi_file-plus",
      name: "Documents",
      url: "/documents",
    },
    {
      icon: "Settings",
      name: "Settings",
      url: "/settings",
    },
    {
      icon: "fi_info",
      name: "Help",
      url: "/help",
    },
  ];
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand-logo">
        <Image
          src={
            "/brand_logo_white/PNGs/Pitstop Logo Variations - White Logo for PNGs-01.png"
          }
          width={161}
          height={48}
          loading="eager"
          alt="pitstop"
        ></Image>
      </div>
      <div className="menu-list">
        <ul>
          {menu_list.map((item) => (
            <Link
              key={item.url}
              href={`/profile${item.url}`}
              aria-current={
                pathname === `/profile${item.url}` ||
                pathname.startsWith(`/profile${item.url}/`)
                  ? "page"
                  : undefined
              }
            >
              <li
                className={
                  pathname === `/profile${item.url}` ||
                  pathname.startsWith(`/profile${item.url}/`)
                    ? "is-active"
                    : undefined
                }
              >
                <span>
                  <Image
                    src={`/icons/sidebar/${item.icon}.svg`}
                    width="24"
                    height="24"
                    alt={item.name}
                  ></Image>
                </span>
                {item.name}
                <span></span>
              </li>
            </Link>
          ))}
        </ul>
      </div>
      <div className="logout-btn">
        <button onClick={logout}>
          <Image
            src="/icons/sidebar/logout-icon.svg"
            width="20"
            height="20"
            alt="logout-btn"
          ></Image>
          Logout
        </button>
      </div>
    </aside>
  );
}
