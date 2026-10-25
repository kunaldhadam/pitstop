import React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { logoutAuth } from "@/lib/allauth";

function RightArrowIcon() {
  return (
    <Image
      src={"/section-images/testimonial-images/right-arrow.png"}
      height={27}
      width={17}
      className="hamburger-right-arrow"
      alt=""
    ></Image>
  );
}

type User = {
  username: string;
  phone_number: string;
};

export default function Hamburg({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const getUser = async () => {
      const res = await fetch("http://localhost:8000/api/accounts/me/", {
        credentials: "include",
      });

      const data = await res.json();
      setUser(data);
    };

    getUser();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await logoutAuth();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="ham">
      {isLoggedIn ? (
        <div className="userprofile">
          <div className="user-details">
            <span>Hi, {user?.username}</span>
            <span>{user?.phone_number}</span>
          </div>
          <div className="edit-icon">
            <a href="/profile">
              <Image
                src={"/icons/ham-icons/edit-icon.svg"}
                height={24}
                width={24}
                alt=""
              ></Image>
            </a>
          </div>
        </div>
      ) : (
        <a href="/login">
          <button>Login / sign up</button>
        </a>
      )}

      <div className="grey-box">
        <ul>
          <li>
            <div className="icon">
              <Image
                src={"/icons/ham-icons/favoutires-icon.svg"}
                width={20}
                height={19}
                alt=""
              ></Image>
            </div>
            <div className="menu-name">Favourites</div>
          </li>
          <li>
            <div className="icon">
              <Image
                src={"/icons/ham-icons/price-icon.svg"}
                height={20}
                width={20}
                alt=""
              ></Image>
            </div>
            <div className="menu-name">Evaluate price</div>
          </li>
          <li>
            <div className="icon">
              <Image
                src={"/icons/ham-icons/time-icon.svg"}
                width={20}
                height={18}
                alt=""
              ></Image>
            </div>
            <div className="menu-name">Notification</div>
          </li>
        </ul>
      </div>
      <div className="other-menus">
        <ul>
          <li>
            <div className="menu-text">Register as tow</div>
            <div className="right-arrow-icon">
              <RightArrowIcon />
            </div>
          </li>
          <li>
            <div className="menu-text">Register your Business</div>
            <div className="right-arrow-icon">
              <RightArrowIcon />
            </div>
          </li>
          <li>
            <div className="menu-text">Membership</div>
            <div className="right-arrow-icon">
              <RightArrowIcon />
            </div>
          </li>
          <li>
            <div className="menu-text">Terms and Conditions</div>
            <div className="right-arrow-icon">
              <RightArrowIcon />
            </div>
          </li>
          <li>
            <div className="menu-text">FAQ</div>
            <div className="right-arrow-icon">
              <RightArrowIcon />
            </div>
          </li>
          <li>
            <div className="menu-text">Contact Us</div>
            <div className="right-arrow-icon">
              <RightArrowIcon />
            </div>
          </li>
          {isLoggedIn ? (
            <li>
              <div className="menu-text">My Ads</div>
              <div className="right-arrow-icon">
                <RightArrowIcon />
              </div>
            </li>
          ) : (
            <></>
          )}
        </ul>
      </div>
      {isLoggedIn ? <button onClick={handleLogout}>Logout</button> : <></>}
    </div>
  );
}
