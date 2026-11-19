// rgb(x, x, x) => #xxxxxx
// rgba(x, x, 1) => #xxxxxx
// rgba(x, x, 0/0.9) => null
// oklab => null

export function rgbToHex(color: string) {
  const match = color.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/);

  if (match === null) {
    return null;
  }

  if (match[4] !== undefined && Number(match[4]) !== 1) {
    return null;
  }

  const channels = match
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"));

  return `#${channels.join("")}`;
}
