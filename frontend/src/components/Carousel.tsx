"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PlaceholderImage } from "@/lib/placeholders";

type CarouselProps = {
  slides: PlaceholderImage[];
  /** Time each slide stays on screen. */
  intervalMs?: number;
};

export default function Carousel({ slides, intervalMs = 4000 }: CarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) {
      return;
    }

    const timer = setInterval(() => setActive((index) => (index + 1) % slides.length), intervalMs);
    return () => clearInterval(timer);
  }, [paused, slides.length, intervalMs]);

  return (
    <section
      aria-label="Featured banners"
      aria-roledescription="carousel"
      className="relative aspect-[16/7] overflow-hidden rounded-xl bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          loading={index === 0 ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 75vw, 100vw"
          aria-hidden={index !== active}
          className={`object-cover transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => setActive(index)}
            className={`h-2 rounded-full transition-all ${index === active ? "w-6 bg-accent" : "w-2 bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
}
