import React from "react";
import Image from "next/image";
export default function Footer() {
  return (
    <>
      <footer>
        <div className="content">
          <div className="menu">
            <div className="row1">
              <div className="col1">
                <div className="pitstop-logo">
                  <Image
                    src={
                      "/brand_logo_white/PNGs/Pitstop Logo Variations - White Logo for PNGs-01.png"
                    }
                    className="main-logo-white"
                    width={181}
                    height={54}
                    alt="pitstop-logo"
                  ></Image>
                </div>
                <div>
                  "Your one-stop destination for all things automotive! Rent,
                  buy, sell cars, find spare parts, and connect with top
                  garages—all in one place. Experience seamless car services
                  with trusted dealers and hassle-free transactions!"
                </div>
              </div>
              <div className="col2">
                <div className="col-head">Company</div>
                <div>
                  <ul>
                    <li>About</li>
                    <li>Service</li>
                    <li>Refund Policy</li>
                    <li>How it works</li>
                  </ul>
                </div>
              </div>
              <div className="col3">
                <div className="col-head">Useful Links</div>
                <div>
                  <ul>
                    <li>Car selling in Dubai</li>
                    <li>Car selling in Abu Dhabi</li>
                  </ul>
                </div>
              </div>
              <div className="col4">
                <div className="col-head">Help</div>
                <div>
                  <ul>
                    <li>Customer Support</li>
                    <li>Terms & Conditions</li>
                    <li>Privacy policy</li>
                    <li>FAQs</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="row2">
              <div className="col1">
                <div className="socials">
                  <ul>
                    <li>
                      <Image
                        src={"/icons/socials/socials-pinterest.svg"}
                        height={20}
                        width={20}
                        alt=""
                      ></Image>
                    </li>
                    <li>
                      <Image
                        src={"/icons/socials/socials-facebook.svg"}
                        height={20}
                        width={20}
                        alt=""
                      ></Image>
                    </li>
                    <li>
                      <Image
                        src={"/icons/socials/socials-twitter.svg"}
                        height={20}
                        width={20}
                        alt=""
                      ></Image>
                    </li>
                    <li>
                      <Image
                        src={"/icons/socials/socials-youtube.svg"}
                        height={20}
                        width={20}
                        alt=""
                      ></Image>
                    </li>
                    <li>
                      <Image
                        src={"/icons/socials/socials-instagram.svg"}
                        height={20}
                        width={20}
                        alt=""
                      ></Image>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col2">
                <div className="yellow-text">Download Pitstop App</div>
                <button>
                  <a href="#">
                    <Image
                      src={
                        "/footer/vecteezy_app-store-download-button-in-white-colors-download-on-the_12871374 1.png"
                      }
                      height={57}
                      width={163}
                      alt=""
                    ></Image>
                  </a>
                </button>
                <button>
                  <a href="#">
                    <Image
                      src={
                        "/footer/vecteezy_google-play-store-download-button-in-white-colors-download_12871364 1.png"
                      }
                      height={57}
                      width={163}
                      alt=""
                    ></Image>
                  </a>
                </button>
              </div>
            </div>
          </div>

          <div className="copyright">
            <Image
              src={"/icons/copyright.svg"}
              height={24}
              width={24}
              alt=""
            ></Image>

            <span>2025 PITSTOP All Right Reserved</span>
          </div>
        </div>
      </footer>
    </>
  );
}
