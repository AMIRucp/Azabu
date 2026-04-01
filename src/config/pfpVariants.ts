export interface PfpVariant {
  id: string;
  name: string;
  era: string;
  helmet: string;
  palette: [string, string, string];
}

export const PFP_VARIANTS: PfpVariant[] = [
  { id: 'oni',     name: 'Oni',     era: '1185 AD', helmet: 'Oni demon kabuto, red lacquer, glowing eyes',        palette: ['#DC143C', '#1A1A1A', '#D4A574'] },
  { id: 'shadow',  name: 'Shadow',  era: '1200 AD', helmet: 'All-black stealth kabuto, cloth face wrap',          palette: ['#0B0B0B', '#1A1A2E', '#D4A574'] },
  { id: 'shogun',  name: 'Shogun',  era: '1600 AD', helmet: 'Gold ornate kabuto, crescent maedate horns',         palette: ['#FFD700', '#1A1A1A', '#DC143C'] },
  { id: 'ronin',   name: 'Ronin',   era: '1600 AD', helmet: 'Jingasa straw hat, cloth mask, weathered',           palette: ['#8B7D5C', '#3E2723', '#D4D0C8'] },
  { id: 'crimson', name: 'Crimson', era: '1300 AD', helmet: 'Deep red kabuto, gold demon mempo, clan crest',      palette: ['#8B0000', '#DC143C', '#FFD700'] },
  { id: 'daimyo',  name: 'Daimyo',  era: '1500 AD', helmet: 'Indigo koboshi riveted kabuto, silver details',      palette: ['#1A1A6E', '#4169E1', '#C0C0C0'] },
  { id: 'wolf',    name: 'Wolf',    era: '1250 AD', helmet: 'Wolf skull crest on iron kabuto, fur pauldrons',     palette: ['#6B6B6B', '#D4D0C8', '#3E3E3E'] },
  { id: 'dragon',  name: 'Dragon',  era: '1400 AD', helmet: 'Dragon crest kabuto, green bronze scaled armor',     palette: ['#2E7D32', '#B87333', '#D4D0C8'] },
  { id: 'phantom', name: 'Phantom', era: 'Unknown', helmet: 'White silver kabuto, spectral ghost warrior',        palette: ['#E8E8E8', '#AACCFF', '#0B0B1A'] },
  { id: 'forge',   name: 'Forge',   era: '1100 AD', helmet: 'Heavy iron kabuto, orange-hot forge glow edges',     palette: ['#1A1A1A', '#D4A574', '#D4A574'] },
];

export function assignRandomPfp(): string {
  const index = Math.floor(Math.random() * PFP_VARIANTS.length);
  return PFP_VARIANTS[index].id;
}

export function getUserPfp(): string {
  if (typeof window === 'undefined') return PFP_VARIANTS[0].id;
  let pfp = localStorage.getItem('afx-pfp');
  if (!pfp || !PFP_VARIANTS.find(v => v.id === pfp)) {
    pfp = assignRandomPfp();
    localStorage.setItem('afx-pfp', pfp);
  }
  return pfp;
}

export function setUserPfp(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('afx-pfp', id);
}

export function getPfpVariant(id: string): PfpVariant | undefined {
  return PFP_VARIANTS.find(v => v.id === id);
}
