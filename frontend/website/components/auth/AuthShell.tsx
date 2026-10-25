"use client";

import Image from "next/image";
import AuthPanel from "./AuthPanel";

export function AuthShell({ mode }: { mode: "login" | "signup" }) {
  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="Pitstop introduction">
        <div className="story-topline">
          <Image
            src="/brand_logo_black/PNGs/pitstop_with_logo.png"
            alt="Pitstop Logo"
            className="story-logo"
            width={200}
            height={100}
          />
          <span className="story-code">EST. 2026 / 001</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">The better way forward</p>
          <h1>
            Keep your
            <br />
            <em>drive</em> alive.
          </h1>
          <p className="story-note">
            Your garage, your vehicles, your next move. Everything important,
            tuned and ready when you are.
          </p>
        </div>
        <div className="story-footer">
          <span>BUILT FOR THE ROAD AHEAD</span>
          <span className="arrow">&#8599;</span>
        </div>
      </section>
      <AuthPanel mode={mode} user="individual" />
    </main>
  );
}
