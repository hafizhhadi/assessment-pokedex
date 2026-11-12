import Image from "next/image";
import type { PlaceholderImage } from "@/lib/placeholders";

export default function StaticBanner({ src, alt }: PlaceholderImage) {
  return (
    <div className="relative min-h-28 overflow-hidden rounded-xl bg-muted">
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
    </div>
  );
}
