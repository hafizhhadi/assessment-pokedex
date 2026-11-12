export default function PokemonCardSkeleton() {
  return (
    <li
      aria-hidden
      data-testid="pokemon-skeleton"
      className="flex animate-pulse items-center gap-3 rounded-lg border border-border bg-background p-3"
    >
      <div className="size-[72px] shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
      </div>
    </li>
  );
}
