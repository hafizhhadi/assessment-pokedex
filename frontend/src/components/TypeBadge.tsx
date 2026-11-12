export default function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
      {type}
    </span>
  );
}
