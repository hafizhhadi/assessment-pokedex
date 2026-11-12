/** "mr-mime" -> "Mr Mime". PokeAPI names are lowercase and hyphenated. */
export function formatName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
