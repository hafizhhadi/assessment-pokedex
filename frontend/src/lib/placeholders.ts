/** Placeholder artwork (the brief allows any placeholder images). Files live in `public/placeholders/`. */

export type PlaceholderImage = {
  src: string;
  alt: string;
};

export const CAROUSEL_SLIDES: PlaceholderImage[] = [
  { src: "/placeholders/carousel-1.svg", alt: "Carousel banner 1" },
  { src: "/placeholders/carousel-2.svg", alt: "Carousel banner 2" },
  { src: "/placeholders/carousel-3.svg", alt: "Carousel banner 3" },
];

export const STATIC_BANNERS: PlaceholderImage[] = [
  { src: "/placeholders/banner-1.svg", alt: "Static banner 1" },
  { src: "/placeholders/banner-2.svg", alt: "Static banner 2" },
];

export const SIDE_IMAGES = {
  left: { src: "/placeholders/side-left.svg", alt: "Static image (left)" },
  right: { src: "/placeholders/side-right.svg", alt: "Static image (right)" },
} satisfies Record<"left" | "right", PlaceholderImage>;
