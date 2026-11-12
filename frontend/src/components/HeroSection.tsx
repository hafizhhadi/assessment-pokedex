import Carousel from "@/components/Carousel";
import StaticBanner from "@/components/StaticBanner";
import { CAROUSEL_SLIDES, STATIC_BANNERS } from "@/lib/placeholders";

/** Top of the page: the carousel with two static banners beside it. It scrolls away with the page. */
export default function HeroSection() {
  return (
    <section aria-label="Featured" className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
      <Carousel slides={CAROUSEL_SLIDES} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        {STATIC_BANNERS.map((banner) => (
          <StaticBanner key={banner.src} {...banner} />
        ))}
      </div>
    </section>
  );
}
