import Image from "next/image";
import TypeBadge from "@/components/TypeBadge";
import { formatName } from "@/lib/format";
import type { Pokemon } from "@/types/pokemon";

const IMAGE_SIZE = 72;

export default function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  const name = formatName(pokemon.name);

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-sm">
      {pokemon.image ? (
        <Image
          src={pokemon.image}
          alt={name}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          className="shrink-0 object-contain"
        />
      ) : (
        <div
          aria-hidden
          className="grid size-[72px] shrink-0 place-items-center rounded-full bg-muted text-xl text-slate-400"
        >
          ?
        </div>
      )}

      <div className="min-w-0">
        <h3 className="truncate font-semibold">{name}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </li>
  );
}
