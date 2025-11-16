// components/Carousel.tsx
"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    id: 1,
    title: "Bid for a Cause with Your Favorite Creator",
    subtitle:
      "Creators host auctions, fans bid, and together you fund life-changing initiatives.",
    tag: "Featured Campaign",
  },
  {
    id: 2,
    title: "Exclusive Calls, Signed Merch & Once-in-a-lifetime Moments",
    subtitle:
      "Win experiences money can’t normally buy – all while giving back.",
    tag: "Experiences",
  },
  {
    id: 3,
    title: "Support Trusted NGOs with Transparent Impact",
    subtitle:
      "Every auction is tied to a verified NGO or cause, so you know where your money goes.",
    tag: "Verified NGOs",
  },
];

export default function Carousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 shadow-lg">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-pink-300">
        <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
        {activeSlide.tag}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
          {activeSlide.title}
        </h2>
        <p className="text-xs text-slate-300 sm:text-sm">
          {activeSlide.subtitle}
        </p>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-pink-400" : "w-2 bg-slate-600"
              }`}
            />
          ))}
        </div>

        <span className="text-[10px] text-slate-400">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
