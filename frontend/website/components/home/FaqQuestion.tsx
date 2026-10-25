"use client";

import React from "react";
import Image from "next/image";
import { useState } from "react";

type FAQ = {
  question: string;
  answer: string;
};

export default function FaqQuestion({
  faq,
  index,
}: {
  faq: FAQ;
  index: number;
}) {
  const [visible, setVisible] = useState<boolean>(false);

  const handleOnClick = () => {
    setVisible(!visible);
  };
  return (
    <>
      <li className="question_item" key={index}>
        <div className="question">
          <button onClick={handleOnClick}>
            <Image
              src={`${visible == true ? "/icons/faq_minus.svg" : "/icons/faq_plus.svg"}`}
              height={15}
              width={15}
              alt=""
            ></Image>
          </button>
          <div>{faq.question}</div>
        </div>
        <div className={`answer ${visible == true ? "show" : "hide"}`}>
          {faq.answer}
        </div>
      </li>
    </>
  );
}
