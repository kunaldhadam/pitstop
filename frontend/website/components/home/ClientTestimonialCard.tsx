import Image from "next/image";

type PositionProps = {
  position?: "left" | "center" | "right";
  name: string;
  comment: string;
};

export default function ClientTestimonialCard({
  position,
  name,
  comment,
}: PositionProps) {
  return (
    <div className={`client-card ${position ?? "hidden"}`}>
      <div className="svg-holder">
        {position == "center" ? (
          <>
            {" "}
            <svg
              className="back-card center"
              width="409"
              height="408"
              viewBox="0 0 409 408"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M49.0275 0C15.2748 8.54892 5.8955 17.6718 0 38.8617L19.4419 407.203H378.695C401.035 395.279 407.889 377.514 408.28 322.721C397.19 212.769 383.656 150.093 363.479 38.8617C353.306 23.4415 351.095 13.1453 311.071 11.8275L49.0275 0Z"
                fill="#F4B520"
              />
            </svg>
            <svg
              className="front-card center"
              width="448"
              height="467"
              viewBox="0 0 448 467"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 363.784L40.4186 59.8223C50.0911 36.8923 58.7099 26.3853 87.3042 14.5514C177.668 6.07358 250.862 4.26438 373.468 0C405.067 9.49192 424.019 14.5732 439.755 59.8223C443.507 182.428 447.457 269.932 447.03 350.041C445.739 385.635 437.817 399.799 409.845 413.906C240.333 445.005 147.57 461.772 67.9033 466.452C19.8615 451.494 0.352477 430.861 0 363.784Z"
                fill="#FBFBFB"
              />
            </svg>
          </>
        ) : position == "left" ? (
          <>
            <svg
              className="back-card left"
              width="370"
              height="436"
              viewBox="0 0 370 436"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_8833_2456)">
                <path
                  d="M34.5002 81.9332C27.024 165.514 23.34 211.098 21.5482 280.386C24.1193 307.301 29.0107 318.932 48.458 328.943C126.707 362.607 181.302 388.521 245.349 412.864C272.34 415.688 282.837 409.915 293.417 395.332C315.175 341.888 325.721 281.66 346.265 205.978C351.518 176.447 347.192 163.62 325.32 147.907C243.862 100.638 125.049 35.0746 125.049 35.0746C125.049 35.0746 102.604 20.4754 88.0858 21.6076C70.883 24.6607 62.9497 29.4743 52.5481 39.9643C40.5088 52.372 36.5881 61.5736 34.5002 81.9332Z"
                  fill="#F4B520"
                />
              </g>
              <defs>
                <filter
                  id="filter0_d_8833_2456"
                  x="0.00173378"
                  y="-0.000219345"
                  width="369.829"
                  height="435.104"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset />
                  <feGaussianBlur stdDeviation="10.7726" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_8833_2456"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_8833_2456"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
            <svg
              className="front-card left"
              width="326"
              height="369"
              viewBox="0 0 326 369"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.0633739 67.172C3.33697 151.022 5.51265 196.704 12.5961 265.652C18.5881 292.017 24.9266 302.926 45.4945 310.369C127.406 333.749 184.867 352.469 251.501 368.422C278.631 367.771 288.304 360.703 296.932 344.887C311.677 289.1 314.435 228.017 325.131 150.329C326.565 120.369 320.634 108.201 296.932 95.4141C210.098 58.9499 83.876 9.11858 83.876 9.11858C83.876 9.11858 59.7489 -2.49048 45.4945 0.489027C28.8234 5.71694 21.5708 11.5056 12.5961 23.2397C2.24234 37.0851 -0.469453 46.7125 0.0633739 67.172Z"
                fill="white"
              />
            </svg>
          </>
        ) : position == "right" ? (
          <>
            <svg
              className="back-card right"
              width="370"
              height="436"
              viewBox="0 0 370 436"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_8833_2466)">
                <path
                  d="M335.336 81.9332C342.812 165.514 346.496 211.098 348.288 280.386C345.717 307.301 340.825 318.932 321.378 328.943C243.128 362.607 188.532 388.521 124.484 412.864C97.4932 415.688 86.9964 409.915 76.4156 395.332C54.6577 341.888 44.1113 281.66 23.5677 205.978C18.3142 176.447 22.6401 163.62 44.5124 147.907C125.972 100.638 244.786 35.0746 244.786 35.0746C244.786 35.0746 267.231 20.4754 281.75 21.6076C298.953 24.6607 306.886 29.4743 317.288 39.9644C329.327 52.372 333.248 61.5736 335.336 81.9332Z"
                  fill="#F4B520"
                />
              </g>
              <defs>
                <filter
                  id="filter0_d_8833_2466"
                  x="0.00173378"
                  y="-0.000219345"
                  width="369.832"
                  height="435.104"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset />
                  <feGaussianBlur stdDeviation="10.7726" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_8833_2466"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_8833_2466"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
            <svg
              className="front-card right"
              width="326"
              height="369"
              viewBox="0 0 326 369"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M325.273 67.172C321.999 151.022 319.823 196.704 312.74 265.652C306.748 292.017 300.409 302.926 279.841 310.369C197.928 333.749 140.467 352.469 73.8316 368.422C46.7012 367.771 37.0289 360.703 28.3999 344.887C13.6551 289.1 10.8975 228.017 0.200989 150.329C-1.23282 120.369 4.69785 108.201 28.4 95.4141C115.236 58.9499 241.459 9.11858 241.459 9.11858C241.459 9.11858 265.586 -2.49048 279.841 0.489027C296.512 5.71694 303.765 11.5056 312.74 23.2397C323.094 37.0851 325.805 46.7125 325.273 67.172Z"
                fill="white"
              />
            </svg>
          </>
        ) : (
          <></>
        )}
      </div>

      <div className={`testimonial-content ${position ?? ""}`}>
        <div className="client-profile-pic">
          <Image
            src={"/section-images/testimonial-images/client-profile-pic.jpg"}
            alt=""
            height={320}
            width={480}
          ></Image>
        </div>
        <div className="client-name">{name}</div>
        <div className="quotes-icon">
          <Image
            src={"/icons/quotes-icon.png"}
            alt=""
            height={39}
            width={39}
          ></Image>
        </div>
        <div className="client-comment">{comment}</div>
      </div>
    </div>
  );
}
