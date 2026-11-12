export default function EmptyState({ query }: { query: string }) {
  return (
    <p className="py-10 text-center text-slate-500">
      {query ? <>No Pokémon found for “{query}”.</> : "No Pokémon to show."}
    </p>
  );
}
