import Image from "next/image";
import CardCarousel from "@/components/home/CardCarousel";
import GarageCard from "@/components/home/GarageCard";
import MostDemandCard from "@/components/home/MostDemandCard";
import TestimonialSection from "@/components/home/TestimonialSection";
import FaqQuestion from "@/components/home/FaqQuestion";

function Home() {
  const card_items = {
    "buy/sell": {
      icon: "/icons/card_icons/material-symbols_car-tag-outline-1.svg",
      desc: "Best in class, cars and bikes",
    },
    rent: {
      icon: "/icons/card_icons/Frame 2087327294.svg",
      desc: "Best in class, cars and bikes",
    },
    spare_parts: {
      icon: "/icons/card_icons/icon-park-outline_baby-car-seat.svg",
      desc: "Parts for all types of vehicles",
    },
    garage: {
      icon: "/icons/card_icons/material-symbols_car-tag-outline-1.svg",
      desc: "Best in class, cars and bikes",
    },
    tow_service: {
      icon: "/icons/card_icons/tabler_car-crane.svg",
      desc: "Best in class, cars and bikes",
    },
  };

  const faqs = [
    {
      question: "How do I create an account?",
      answer:
        "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Exercitationem eligendi cumque officiis itaque ut. Saepe perferendis qui recusandae in eos beatae eaque. Ad quaerat voluptates eligendi. Aspernatur nobis soluta omnis?",
    },
    {
      question: "How can I contact customer support?",
      answer:
        "You can contact our customer support team through the Contact Us section on our platform.",
    },
    {
      question: "How do I rent a car or bike from your platform?",
      answer:
        "Browse the available vehicles, select the one you want, choose your rental duration, and complete the booking.",
    },
    {
      question: "What should I do if I face any issues with a transaction?",
      answer:
        "Please contact customer support with your transaction details so we can help resolve the issue.",
    },
    {
      question: "Can I rent a vehicle for long-term use?",
      answer:
        "Yes, long-term vehicle rentals are available for eligible vehicles. Check the rental options for available durations.",
    },
  ];

  return (
    <div className="home-page">
      <section className="banner">
        <div className="home-banner">
          <video
            src="/bg-video/5057529-uhd_3840_2160_25fps.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="hero-video"
            preload="metadata"
            poster="/section-images/hero-poster.webp"
          ></video>
          <div className="banner-text">
            <div className="text">
              <div className="white-text">Auto Care, Simplified</div>
              <div className="yellow-text">
                Finds
                <span
                  className="span-dot
"
                >
                  .
                </span>
                Fix<span>.</span>Drive<span>.</span>
              </div>
            </div>
            <div className="search-box">
              <div className="search">
                <input
                  id="search-bar"
                  type="text"
                  placeholder="Search Cars / Bikes / Square Parts"
                />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  fill="none"
                  viewBox="0 0 25 25"
                >
                  <path
                    stroke="#F4B520"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                    d="m21.875 21.875-4.531-4.531m2.448-5.886a8.333 8.333 0 1 1-16.667 0 8.333 8.333 0 0 1 16.667 0"
                  ></path>
                </svg>
              </div>
              <div>
                <button>Explore</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="link-cards">
        <div className="grey-area"></div>
        <div className="cards-wrapper">
          <div className="heading">
            <div>One-stop hub for all automotive needs in the UAE</div>
          </div>
          <div className="cards-holder">
            {Object.entries(card_items).map(([key, item]) => (
              <div className="card" key={key}>
                <div className="icon-holder">
                  <div className="icon">
                    <Image src={item.icon} height={25} width={25} alt="" />
                  </div>
                  <div className="arrow-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="57"
                      height="57"
                      fill="none"
                      viewBox="0 0 57 57"
                    >
                      <rect
                        width="40"
                        height="40"
                        y="28.284"
                        fill="#F7F7F7"
                        rx="20"
                        transform="rotate(-45 0 28.284)"
                      ></rect>
                      <path
                        stroke="#F4B520"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.75"
                        d="m20.035 36.534 16.499-16.5m0 16.5v-16.5h-16.5"
                      ></path>
                    </svg>
                  </div>
                </div>

                <div className="card-name">
                  {key
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
                <div className="card-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div className="background-image"></div>
        <div className="head">
          How It <span>Works</span>
        </div>
        <div className="card-holder-grid">
          <div className="card-flex">
            <div className="digit">01</div>
            <div className="text">
              <div className="heading">Search spare parts or cars, bike</div>
              <div className="description">
                Easily find the right parts, vehicles, or rentals for your
                needs.
              </div>
            </div>
          </div>
          <div className="card-flex">
            <div className="digit">02</div>
            <div className="text">
              <div className="heading">Select Services You Need</div>
              <div className="description">
                Choose from a variety of options and book services or buy parts
                in just a few clicks.
              </div>
            </div>
          </div>
          <div className="card-flex">
            <div className="digit">03</div>
            <div className="text">
              <div className="heading">Book or Buy Instantly</div>
              <div className="description">
                Browse through inspection, garage services, and towing services
                based on your location and preferences
              </div>
            </div>
          </div>
          <div className="card-flex">
            <div className="digit">04</div>
            <div className="text">
              <div className="heading">Track Your Request </div>
              <div className="description">
                Once your request is confirmed, track the progress of your
                service in real-time.
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="most-popular">
        <div className="head">
          <div className="h1">Most Popular</div>
          <div className="h2">"Find Your Favourite Cars & Bikes Here"</div>
        </div>
        <CardCarousel />
        <div className="buy-rent-link">
          <div className="car-ad-wrapper">
            <div className="Img1">
              <div className="text-on-img1">
                <div className="upper-text">
                  BUY YOUR <span className="yellow-text">DREAM</span> CAR FROM
                  <span className="yellow-text">PITSTOP</span>
                </div>
                <div className="slim-text">
                  BUY A CAR AND TRAVEL WITH FAMILY
                </div>
              </div>
              <Image
                src={"/section-images/Group 249.jpg"}
                alt=""
                height={334}
                width={610}
              ></Image>
              <button>
                <span>BUY NOW</span>
              </button>
            </div>
            <div className="Img2">
              <Image
                src={"/section-images/Rent Your.jpg"}
                alt=""
                height={334}
                width={610}
              ></Image>
              <button>
                <span>BOOk NOW</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="top-garages">
        <div className="glow">
          <Image
            src={"/section-images/glow-light.png"}
            alt=""
            height={696}
            width={825}
          ></Image>
        </div>
        <div className="content-container">
          <div className="text-heading">
            <div className="h1">
              Top <span className="yellow-text">Garages</span>
            </div>
            <div className="h2">"You Pit Stop for Smooth Journeys"</div>
          </div>
          <div className="card-scroll">
            <div className="card-scroller">
              {Array.from({ length: 4 }, (_, i) => (
                <GarageCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="most-demand">
        <div className="item-holder">
          <div className="column-3-grid">
            <div>
              <div className="heading">
                <span>Top Grade</span>
              </div>
              <div className="card-holder-grid">
                <MostDemandCard />
                <MostDemandCard />
                <MostDemandCard />
              </div>
            </div>
            <div>
              <div className="heading">
                <span>Verified</span>
              </div>
              <div className="card-holder-grid-center">
                <div className="most-demand-text">
                  <div className="first">Most Demanded</div>
                  <div className="second">Spare-Parts</div>
                </div>
                <MostDemandCard />
              </div>
            </div>
            <div>
              <div className="heading">
                <span>Reliable</span>
              </div>
              <div className="card-holder-grid">
                <MostDemandCard />
                <MostDemandCard />
                <MostDemandCard />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="testimonials">
        <TestimonialSection />
      </section>
      <section className="faq">
        <div className="container">
          <div className="h1">Frequently Asked Questions</div>
          <div className="questions">
            <ul>
              {faqs.map((faq, index) => (
                <FaqQuestion key={index} faq={faq} index={index} />
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
