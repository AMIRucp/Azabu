import { create } from 'zustand';
import { PFP_VARIANTS } from '@/config/pfpVariants';

export interface UserSettings {
  sound: boolean;
  glitchEffects: boolean;
  showXp: boolean;
}

export interface UserState {
  address: string;
  shortAddress: string;
  pfpId: string;
  callsign: string;
  rank: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: string;
  totalTrades: number;
  totalVolume: number;
  winRate: number;
  joinedAt: string;
  achievements: string[];
  chainsTraded: string[];
  protocolsTraded: string[];
  marketsTraded: string[];
  settings: UserSettings;
  initialized: boolean;
}

const DEFAULT_STATE: UserState = {
  address: '',
  shortAddress: '',
  pfpId: '',
  callsign: '',
  rank: 'Recruit',
  xp: 0,
  level: 1,
  streak: 0,
  lastActive: '',
  totalTrades: 0,
  totalVolume: 0,
  winRate: 0,
  joinedAt: '',
  achievements: [],
  chainsTraded: [],
  protocolsTraded: [],
  marketsTraded: [],
  settings: { sound: true, glitchEffects: true, showXp: true },
  initialized: false,
};

const useUserStore = create<UserState>(() => ({ ...DEFAULT_STATE }));

const CALLSIGN_PREFIXES = [
  'Ghost', 'Viper', 'Shadow', 'Phantom', 'Raven', 'Cobra', 'Hawk', 'Wolf',
  'Reaper', 'Spectre', 'Nomad', 'Cipher', 'Apex', 'Onyx', 'Storm',
  'Wraith', 'Talon', 'Saber', 'Ember', 'Frost',
];

const CALLSIGN_SUFFIXES = ['', '-1', '-7', '-13', '-00', '-X', '-9', '-3'];

function generateCallsign(): string {
  const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const suffix = CALLSIGN_SUFFIXES[Math.floor(Math.random() * CALLSIGN_SUFFIXES.length)];
  return prefix + suffix;
}

function checkStreak(data: Partial<UserState>): { streak: number; lastActive: string } {
  const now = new Date();
  const nowIso = now.toISOString();
  if (!data.lastActive) return { streak: 1, lastActive: nowIso };

  const last = new Date(data.lastActive);
  const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

  if (diffHours < 48) {
    if (diffHours > 20) {
      return { streak: (data.streak || 0) + 1, lastActive: nowIso };
    }
    return { streak: data.streak || 1, lastActive: data.lastActive };
  }
  return { streak: 1, lastActive: nowIso };
}

export function saveUser() {
  const state = useUserStore.getState();
  if (!state.address) return;
  const { initialized, ...data } = state;
  localStorage.setItem(`afx-user-${state.address}`, JSON.stringify(data));
}

export function initUser(address: string, existingPfpId?: string) {
  const stored = localStorage.getItem(`afx-user-${address}`);
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  if (stored) {
    try {
      const data = JSON.parse(stored);
      const streakResult = checkStreak(data);
      const rawPfp = existingPfpId || data.pfpId;
      const validPfp = PFP_VARIANTS.find(v => v.id === rawPfp)
        ? rawPfp
        : PFP_VARIANTS[Math.floor(Math.random() * PFP_VARIANTS.length)].id;
      useUserStore.setState({
        ...data,
        address,
        shortAddress,
        pfpId: validPfp,
        ...streakResult,
        initialized: true,
      });
      saveUser();
      return;
    } catch {}
  }

  const pfpId = existingPfpId || PFP_VARIANTS[Math.floor(Math.random() * PFP_VARIANTS.length)].id;
  const callsign = generateCallsign();
  const now = new Date().toISOString();

  useUserStore.setState({
    address,
    shortAddress,
    pfpId,
    callsign,
    rank: 'Recruit',
    xp: 0,
    level: 1,
    streak: 1,
    lastActive: now,
    totalTrades: 0,
    totalVolume: 0,
    winRate: 0,
    joinedAt: now,
    achievements: ['first_connect'],
    chainsTraded: [],
    protocolsTraded: [],
    marketsTraded: [],
    settings: { sound: true, glitchEffects: true, showXp: true },
    initialized: true,
  });
  saveUser();
}

export function resetUser() {
  useUserStore.setState({ ...DEFAULT_STATE });
}

export default useUserStore;
