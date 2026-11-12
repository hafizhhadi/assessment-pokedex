import Image from "next/image";
import type { PlaceholderImage } from "@/lib/placeholders";

/** A tall image beside the list. It sticks to the top of the screen while the page scrolls. */
export default function SideImage({ src, alt }: PlaceholderImage) {
  return (
    <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] self-start lg:block">
      <div className="relative h-full overflow-hidden rounded-xl bg-muted">
        <Image src={src} alt={alt} fill loading="eager" sizes="200px" className="object-cover" />
      </div>
    </aside>
  );
}
