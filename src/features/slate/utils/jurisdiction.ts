import type { SlateToken, SlateUser } from "../types/slate.types";

export function tokenInJurisdiction(token: SlateToken, user: SlateUser | null): boolean {
  if (!user?.jurisdiction) return true;
  const { district, taluk, village } = user.jurisdiction;
  if (token.location.district !== district) return false;
  if (taluk && token.location.taluk !== taluk) return false;
  if (village && token.location.village !== village) return false;
  return true;
}

export function jurisdictionLabel(user: SlateUser | null): string | null {
  if (!user?.jurisdiction) return null;
  const { village, taluk, district } = user.jurisdiction;
  return village ? `${village}, ${taluk} Taluk` : `${taluk} Taluk, ${district}`;
}
