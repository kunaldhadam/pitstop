import React from "react";
import Image from "next/image";

export default function GarageCard() {
  const reviewCount = 5;

  return (
    <div className="card-wrapper">
      <div className="card">
        <div className="garage-image">
          <Image
            src={"/section-images/top-garage-image.png"}
            alt=""
            height={297}
            width={320}
          ></Image>
        </div>
        <div className="details-wrapper">
          <div className="child">
            <div className="star-review flex">
              {Array.from({ length: reviewCount }, (_, i) => (
                <span className="star-icon" key={i}>
                  ⭐
                </span>
              ))}
            </div>
            <div className="garage-name">Carzilla Auto Service</div>
            <div className="garage-location">
              <span className="location-icon">
                <svg
                  width="14"
                  height="18"
                  viewBox="0 0 14 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 0C3.13556 0 0 2.59192 0 5.78571C0 10.9286 7 18 7 18C7 18 14 10.9286 14 5.78571C14 2.59192 10.8644 0 7 0ZM7 9C6.44621 9 5.90486 8.84919 5.4444 8.56664C4.98395 8.28408 4.62506 7.88248 4.41314 7.41261C4.20121 6.94275 4.14576 6.42572 4.2538 5.92691C4.36184 5.4281 4.62851 4.96992 5.0201 4.6103C5.41169 4.25068 5.9106 4.00577 6.45375 3.90655C6.99689 3.80733 7.55988 3.85826 8.07151 4.05288C8.58315 4.24751 9.02045 4.57709 9.32811 4.99996C9.63578 5.42283 9.8 5.91999 9.8 6.42857C9.79919 7.11033 9.50393 7.76395 8.979 8.24602C8.45408 8.7281 7.74236 8.99926 7 9Z"
                    fill="#F4B520"
                  />
                </svg>
              </span>
              <span>Al Wahda Road, Sharjah</span>
            </div>
            <div className="garage-operating-hours">
              <span className="time-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 0C4.02966 0 0 4.02966 0 9C0 13.9625 4.03788 18 9 18C13.9699 18 18 13.9699 18 9C18 4.03745 13.9625 0 9 0ZM13.6731 10.3846H8.48077C8.43487 10.3846 8.39084 10.3664 8.35839 10.3339C8.32593 10.3015 8.30769 10.2574 8.30769 10.2115V2.94231C8.30769 2.8964 8.32593 2.85238 8.35839 2.81992C8.39084 2.78747 8.43487 2.76923 8.48077 2.76923H9.51923C9.56513 2.76923 9.60916 2.78747 9.64161 2.81992C9.67407 2.85238 9.69231 2.8964 9.69231 2.94231V9H13.6731C13.719 9 13.763 9.01824 13.7955 9.05069C13.8279 9.08315 13.8462 9.12717 13.8462 9.17308V10.2115C13.8462 10.2574 13.8279 10.3015 13.7955 10.3339C13.763 10.3664 13.719 10.3846 13.6731 10.3846Z"
                    fill="#F4B520"
                  />
                </svg>
              </span>
              <span>8 AM - 11 PM</span>
            </div>
            <div className="services">
              <ul className="service-list">
                <li className="single-service">Body paint</li>
                <li className="single-service">Service history</li>
                <li className="single-service">Maintainance</li>
                <li className="single-service">Engine service</li>
              </ul>
            </div>
            <button className="view-profile">
              <span>View Profile</span>
              <span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.751511 9.13653L9.68473 1.29757M9.1376 9.68366L9.68473 1.29757L1.29864 0.750442"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
