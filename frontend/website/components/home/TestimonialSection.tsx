"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import ClientTestimonialCard from "@/components/home/ClientTestimonialCard";

export default function TestimonialSection() {
  const testimonials = [
    {
      name: "Hannah Schmitt",
      comment:
        "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Exercitationem eligendi cumque officiis itaque ut. Saepe perferendis qui recusandae in eos beatae eaque. Ad quaerat voluptates eligendi. Aspernatur nobis soluta omnis?",
    },
    {
      name: "Daniel Smith",
      comment:
        "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Exercitationem eligendi cumque officiis itaque ut. Saepe perferendis qui recusandae in eos beatae eaque. Ad quaerat voluptates eligendi. Aspernatur nobis soluta omnis?",
    },
    {
      name: "Ava Wilson",
      comment:
        "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Exercitationem eligendi cumque officiis itaque ut. Saepe perferendis qui recusandae in eos beatae eaque. Ad quaerat voluptates eligendi. Aspernatur nobis soluta omnis?",
    },
    {
      name: "Oliver Brown",
      comment: "Excellent automotive support and service.",
    },
    {
      name: "Sophia Miller",
      comment: "A convenient platform for all my car needs.",
    },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const getTestimonialIndex = (offset: number) =>
    (activeTestimonial + offset + testimonials.length) % testimonials.length;

  const getPosition = (index: number) => {
    if (index === getTestimonialIndex(-1)) return "left" as const;
    if (index === activeTestimonial) return "center" as const;
    if (index === getTestimonialIndex(1)) return "right" as const;

    return undefined;
  };

  const showPreviousTestimonial = () => {
    setActiveTestimonial(
      (current) => (current - 1 + testimonials.length) % testimonials.length,
    );
  };

  const showNextTestimonial = () => {
    setActiveTestimonial((current) => (current + 1) % testimonials.length);
  };
  return (
    <>
      <div className="content-container">
        <div className="heading h1">
          What Our Clients Say <span>About Us</span>
        </div>
        <div className="clients-cards">
          {testimonials.map((testimonial, index) => (
            <ClientTestimonialCard
              key={index}
              position={getPosition(index)}
              name={testimonial.name}
              comment={testimonial.comment}
            />
          ))}
        </div>
        <div className="pagination">
          <button
            type="button"
            className="left-arrow"
            onClick={showPreviousTestimonial}
            aria-label="Previous testimonial"
          >
            <Image
              src={"/section-images/testimonial-images/left-arrow.png"}
              height={22}
              width={11}
              alt=""
            ></Image>
          </button>
          <div className="pagination-dots">
            {testimonials.map((_, index) => (
              <button
                type="button"
                className={`dot ${index === activeTestimonial ? "active" : ""}`}
                key={index}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="right-arrow"
            onClick={showNextTestimonial}
            aria-label="Next testimonial"
          >
            <Image
              src={"/section-images/testimonial-images/right-arrow.png"}
              height={27}
              width={17}
              alt=""
            ></Image>
          </button>
        </div>
      </div>
    </>
  );
}
