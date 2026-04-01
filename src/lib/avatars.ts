import { PFP_VARIANTS, getPfpVariant, type PfpVariant } from '@/config/pfpVariants';

export interface AvatarDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  src: string;
}

function variantToAvatar(v: PfpVariant): AvatarDef {
  return {
    id: v.id,
    label: v.name,
    emoji: '',
    color: v.palette[0],
    src: `/pfp/${v.id}.png`,
  };
}

export const AVATARS: AvatarDef[] = PFP_VARIANTS.map(variantToAvatar);

export function getAvatar(id: string): AvatarDef | undefined {
  const v = getPfpVariant(id);
  if (!v) return undefined;
  return variantToAvatar(v);
}
