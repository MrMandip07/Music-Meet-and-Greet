// Small helper for default team avatars when no photo is uploaded yet.

const avatarPalettes = [
  { bg: "hsl(210 35% 92%)", accent: "hsl(218 66% 52%)" },
  { bg: "hsl(345 55% 93%)", accent: "hsl(345 62% 48%)" },
  { bg: "hsl(145 28% 92%)", accent: "hsl(145 45% 36%)" },
  { bg: "hsl(38 65% 92%)", accent: "hsl(32 72% 46%)" },
  { bg: "hsl(265 34% 92%)", accent: "hsl(260 42% 48%)" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getDeveloperPlaceholder(name: string, index = 0) {
  const palette = avatarPalettes[index % avatarPalettes.length];
  const initials = getInitials(name || "Dev");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" fill="none">
      <rect width="320" height="320" rx="32" fill="${palette.bg}" />
      <circle cx="160" cy="124" r="64" fill="${palette.accent}" opacity="0.88" />
      <path d="M70 278c16-49 52-78 90-78 38 0 74 29 90 78" fill="${palette.accent}" opacity="0.24" />
      <text x="160" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="white">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}