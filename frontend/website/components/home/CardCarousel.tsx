"use client";

import React from "react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

function CarCard() {
  return (
    <div>
      <div className="card">
        <div className="card-image-wrapper">
          <div className="card-image">
            <Image
              src={"/icons/card_icons/lambo.jpg"}
              alt=""
              height={261}
              width={363}
            ></Image>
          </div>
          <div className="car-name">Lamborghini Huracan - 2022</div>
        </div>
        <div className="details-row1">
          <svg
            width="19"
            height="14"
            viewBox="0 0 19 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.4623 4.45092C17.4345 4.40758 17.3978 4.37115 17.3547 4.34428C17.3116 4.31741 17.2632 4.30077 17.2131 4.29558C17.163 4.29039 17.1124 4.29676 17.065 4.31425C17.0176 4.33174 16.9746 4.35989 16.939 4.39667L10.5423 10.9955C10.4129 11.1142 10.2443 11.1773 10.0712 11.1719C9.89805 11.1665 9.73347 11.0931 9.61117 10.9666C9.48886 10.84 9.41807 10.6701 9.41333 10.4915C9.40858 10.3129 9.47022 10.1391 9.58562 10.0059L17.4479 1.8961C17.5109 1.83107 17.5609 1.75386 17.595 1.66889C17.6292 1.58392 17.6467 1.49285 17.6467 1.40088C17.6467 1.30891 17.6292 1.21785 17.595 1.13288C17.5609 1.04791 17.5109 0.970702 17.4479 0.905669C17.3848 0.840637 17.31 0.78905 17.2276 0.753855C17.1453 0.718659 17.057 0.700545 16.9678 0.700545C16.8787 0.700545 16.7904 0.718659 16.708 0.753855C16.6257 0.78905 16.5508 0.840637 16.4878 0.905669L15.353 2.07721C13.7334 0.772394 11.7476 0.0442553 9.69306 0.00195322C7.63854 -0.0403489 5.62608 0.605465 3.95737 1.84258C2.28866 3.07969 1.05362 4.84145 0.437381 6.86374C-0.178853 8.88603 -0.143073 11.0599 0.539357 13.0594C0.632854 13.3336 0.80631 13.5712 1.03592 13.7396C1.26552 13.908 1.54002 13.999 1.82174 14H17.179C17.4605 14.0002 17.735 13.9101 17.9646 13.7422C18.1942 13.5743 18.3675 13.3369 18.4606 13.0629C18.9442 11.6444 19.1057 10.1302 18.9326 8.63713C18.7596 7.14403 18.2565 5.71184 17.4623 4.45092ZM3.51633 11.0611C3.55209 11.243 3.51633 11.4321 3.41692 11.5869C3.31751 11.7416 3.16259 11.8492 2.98624 11.8861C2.94158 11.8955 2.89611 11.9002 2.85054 11.9001C2.69415 11.8999 2.54263 11.844 2.42162 11.7418C2.3006 11.6396 2.21753 11.4974 2.18645 11.3393C1.94381 10.1072 1.99716 8.83253 2.34184 7.62656C2.68652 6.4206 3.31204 5.31997 4.16384 4.42072C5.01564 3.52147 6.06782 2.85093 7.22858 2.4676C8.38933 2.08427 9.62339 1.99981 10.8231 2.22158C11.0002 2.2543 11.1575 2.35827 11.2603 2.51062C11.3631 2.66297 11.4031 2.85122 11.3714 3.03396C11.3397 3.2167 11.2389 3.37895 11.0912 3.48503C10.9435 3.59111 10.761 3.63232 10.5839 3.59961C9.60217 3.4183 8.59237 3.48755 7.64256 3.80131C6.69275 4.11507 5.83178 4.66381 5.13477 5.39967C4.43776 6.13553 3.92588 7.03615 3.64378 8.02297C3.36167 9.00978 3.31792 10.0528 3.51633 11.0611Z"
              fill="#959595"
              fillOpacity="0.61"
            />
          </svg>
          <span>7,000 Km</span>
          <span className="span-dot">.</span>
          <svg
            width="14"
            height="15"
            viewBox="0 0 14 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.8788 5.83333C11.6538 5.83333 11.4379 5.74554 11.2788 5.58926C11.1197 5.43297 11.0303 5.22101 11.0303 5C11.0303 4.77899 11.1197 4.56702 11.2788 4.41074C11.4379 4.25446 11.6538 4.16667 11.8788 4.16667C12.1038 4.16667 12.3196 4.25446 12.4788 4.41074C12.6379 4.56702 12.7273 4.77899 12.7273 5C12.7273 5.22101 12.6379 5.43297 12.4788 5.58926C12.3196 5.74554 12.1038 5.83333 11.8788 5.83333ZM6.78788 5.83333H1.69697V1.66667H6.78788M13.3806 3.525L13.3891 3.51667L10.2327 0.416667L9.33333 1.3L11.1236 3.05833C10.3261 3.33333 9.75758 4.10833 9.75758 5C9.75758 5.27359 9.81244 5.5445 9.91904 5.79726C10.0256 6.05002 10.1819 6.27968 10.3789 6.47314C10.7767 6.86384 11.3162 7.08333 11.8788 7.08333C12.1842 7.08333 12.4642 7.01667 12.7273 6.90833V12.9167C12.7273 13.1377 12.6379 13.3496 12.4788 13.5059C12.3196 13.6622 12.1038 13.75 11.8788 13.75C11.6538 13.75 11.4379 13.6622 11.2788 13.5059C11.1197 13.3496 11.0303 13.1377 11.0303 12.9167V9.16667C11.0303 8.72464 10.8515 8.30072 10.5333 7.98816C10.215 7.67559 9.7834 7.5 9.33333 7.5H8.48485V1.66667C8.48485 1.22464 8.30606 0.800716 7.98782 0.488155C7.66957 0.175595 7.23794 0 6.78788 0H1.69697C0.755152 0 0 0.741667 0 1.66667V15H8.48485V8.75H9.75758V12.9167C9.75758 13.4692 9.98106 13.9991 10.3789 14.3898C10.7767 14.7805 11.3162 15 11.8788 15C12.1573 15 12.4332 14.9461 12.6905 14.8414C12.9479 14.7367 13.1817 14.5833 13.3787 14.3898C13.5757 14.1964 13.7319 13.9667 13.8385 13.7139C13.9451 13.4612 14 13.1903 14 12.9167V5C14 4.425 13.7624 3.9 13.3806 3.525Z"
              fill="#959595"
              fillOpacity="0.61"
            />
          </svg>
          <span>Petrol</span>
          <span className="span-dot">.</span>
          <svg
            width="17"
            height="14"
            viewBox="0 0 17 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.31818 14C1.67424 14 1.12689 13.7731 0.676136 13.3194C0.225379 12.8657 0 12.3148 0 11.6667C0 11.1611 0.145015 10.7074 0.435045 10.3056C0.725076 9.9037 1.09521 9.625 1.54545 9.46945V4.53056C1.0947 4.375 0.724561 4.0963 0.435045 3.69444C0.14553 3.29259 0.000515151 2.83889 0 2.33333C0 1.68519 0.225379 1.13426 0.676136 0.680556C1.12689 0.226852 1.67424 0 2.31818 0C2.96212 0 3.50947 0.226852 3.96023 0.680556C4.41098 1.13426 4.63636 1.68519 4.63636 2.33333C4.63636 2.83889 4.49161 3.29259 4.20209 3.69444C3.91258 4.0963 3.54218 4.375 3.09091 4.53056V6.22222H7.72727V4.53056C7.27652 4.375 6.90638 4.0963 6.61686 3.69444C6.32735 3.29259 6.18233 2.83889 6.18182 2.33333C6.18182 1.68519 6.4072 1.13426 6.85795 0.680556C7.30871 0.226852 7.85606 0 8.5 0C9.14394 0 9.69129 0.226852 10.142 0.680556C10.5928 1.13426 10.8182 1.68519 10.8182 2.33333C10.8182 2.83889 10.6734 3.29259 10.3839 3.69444C10.0944 4.0963 9.724 4.375 9.27273 4.53056V6.22222H13.1364C13.3553 6.22222 13.539 6.14782 13.6873 5.999C13.8357 5.85019 13.9096 5.66533 13.9091 5.44444V4.53056C13.4583 4.375 13.0882 4.0963 12.7987 3.69444C12.5092 3.29259 12.3642 2.83889 12.3636 2.33333C12.3636 1.68519 12.589 1.13426 13.0398 0.680556C13.4905 0.226852 14.0379 0 14.6818 0C15.3258 0 15.8731 0.226852 16.3239 0.680556C16.7746 1.13426 17 1.68519 17 2.33333C17 2.83889 16.8552 3.29259 16.5657 3.69444C16.2762 4.0963 15.9058 4.375 15.4545 4.53056V5.44444C15.4545 6.09259 15.2292 6.64352 14.7784 7.09722C14.3277 7.55093 13.7803 7.77778 13.1364 7.77778H9.27273V9.46945C9.72348 9.625 10.0939 9.9037 10.3839 10.3056C10.6739 10.7074 10.8187 11.1611 10.8182 11.6667C10.8182 12.3148 10.5928 12.8657 10.142 13.3194C9.69129 13.7731 9.14394 14 8.5 14C7.85606 14 7.30871 13.7731 6.85795 13.3194C6.4072 12.8657 6.18182 12.3148 6.18182 11.6667C6.18182 11.1611 6.32683 10.7074 6.61686 10.3056C6.90689 9.9037 7.27703 9.625 7.72727 9.46945V7.77778H3.09091V9.46945C3.54167 9.625 3.91206 9.9037 4.20209 10.3056C4.49212 10.7074 4.63688 11.1611 4.63636 11.6667C4.63636 12.3148 4.41098 12.8657 3.96023 13.3194C3.50947 13.7731 2.96212 14 2.31818 14Z"
              fill="#959595"
              fillOpacity="0.61"
            />
          </svg>
          <span>Automatic</span>
          <span className="span-dot">.</span>
        </div>
        <div className="details-row2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_8936_2199)">
              <path
                d="M15.305 12.2598C14.5016 11.3893 13.5266 10.6946 12.4415 10.2195C11.3563 9.74432 10.1846 9.49902 9 9.49902C7.81541 9.49902 6.64365 9.74432 5.55853 10.2195C4.4734 10.6946 3.49843 11.3893 2.695 12.2598C2.57055 12.3967 2.5011 12.5748 2.5 12.7598V15.7598C2.50263 15.957 2.58281 16.1452 2.72317 16.2837C2.86354 16.4222 3.05281 16.4998 3.25 16.4998H14.75C14.9489 16.4998 15.1397 16.4208 15.2803 16.2801C15.421 16.1395 15.5 15.9487 15.5 15.7498V12.7498C15.4965 12.5682 15.4272 12.3941 15.305 12.2598Z"
                fill="#959595"
                fillOpacity="0.61"
              />
              <path
                d="M9 8.5C10.933 8.5 12.5 6.933 12.5 5C12.5 3.067 10.933 1.5 9 1.5C7.067 1.5 5.5 3.067 5.5 5C5.5 6.933 7.067 8.5 9 8.5Z"
                fill="#959595"
                fillOpacity="0.61"
              />
            </g>
            <defs>
              <clipPath id="clip0_8936_2199">
                <rect width="18" height="18" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <span>1st Owner</span>
          <div>AED 855,000</div>
        </div>
        <div className="link-btn"></div>
      </div>
    </div>
  );
}
const originalCards = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const CLONES = 2;
const carouselItems = [
  ...originalCards.slice(-CLONES),
  ...originalCards,
  ...originalCards.slice(0, CLONES),
];
export default function CardCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(5);
  /* * Scale configuration */ const MIN_SCALE = 0.7;
  const MAX_SCALE = 1;
  const MAX_DISTANCE = 500;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const element = container.children[5] as HTMLElement;
      if (!element) return;

      container.scrollLeft =
        element.offsetLeft - (container.clientWidth - element.offsetWidth) / 2;
    });
  }, []);
  /* * Calculate scale based on distance from * the center of the carousel. */
  const getScale = (element: HTMLElement, container: HTMLDivElement) => {
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const elementCenter = element.offsetLeft + element.offsetWidth / 2;
    const distance = Math.abs(elementCenter - containerCenter);
    /* * Convert distance into 0 → 1. * * 0 = center * 1 = MAX_DISTANCE or further */ const progress =
      Math.min(distance / MAX_DISTANCE, 1);
    /* * Center: * progress = 0 → scale 1 * * Far away: * progress = 1 → scale 0.7 */ return (
      MAX_SCALE - progress * (MAX_SCALE - MIN_SCALE)
    );
  };
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;
    Array.from(container.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const elementCenter = element.offsetLeft + element.offsetWidth / 2;
      const distance = Math.abs(elementCenter - containerCenter);
      /* * Find the card currently closest * to the center. */ if (
        distance < closestDistance
      ) {
        closestDistance = distance;
        closestIndex = index;
      }
      /* * Continuously scale every card. */
      const scale = getScale(element, container);
      element.style.transform = `scale(${scale})`;
    });
    setCurrentIndex(closestIndex);
  };
  /* * Set initial scales after mounting. */ useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const event = {
        currentTarget: container,
      } as React.UIEvent<HTMLDivElement>;
      handleScroll(event);
    });
  }, []);
  return (
    <div className="carousel">
      <div className="card-wrapper" ref={containerRef} onScroll={handleScroll}>
        {carouselItems.map((card, index) => (
          <div
            className="card-container"
            key={index}
            style={{ transform: "scale(0.7)" }}
          >
            <CarCard />
          </div>
        ))}
      </div>
    </div>
  );
}
