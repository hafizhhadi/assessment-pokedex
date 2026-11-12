import HeroSection from "@/components/HeroSection";
import PokemonExplorer from "@/components/PokemonExplorer";
import SideImage from "@/components/SideImage";
import { SIDE_IMAGES } from "@/lib/placeholders";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6">
      <HeroSection />

      {/* Side images and the search bar stay in place while the list scrolls (see SideImage / PokemonExplorer). */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
        <SideImage {...SIDE_IMAGES.left} />
        <PokemonExplorer />
        <SideImage {...SIDE_IMAGES.right} />
      </div>
    </main>
  );
}
