export const ASTER_APPROVAL_STORAGE_KEY = "aster_pro_two_step_v3";

export function isAsterApprovedInStorage(address: string): boolean {
  try {
    const stored = localStorage.getItem(ASTER_APPROVAL_STORAGE_KEY);
    if (!stored) return false;
    const list: string[] = JSON.parse(stored);
    return list.includes(address.toLowerCase());
  } catch {
    return false;
  }
}

export function markAsterApprovedInStorage(address: string): void {
  try {
    const stored = localStorage.getItem(ASTER_APPROVAL_STORAGE_KEY);
    const list: string[] = stored ? JSON.parse(stored) : [];
    if (!list.includes(address.toLowerCase())) {
      list.push(address.toLowerCase());
      localStorage.setItem(ASTER_APPROVAL_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    
  }
}

export function unmarkAsterApprovedInStorage(address: string): void {
  try {
    const stored = localStorage.getItem(ASTER_APPROVAL_STORAGE_KEY);
    if (!stored) return;
    const list: string[] = JSON.parse(stored).filter((a: string) => a !== address.toLowerCase());
    localStorage.setItem(ASTER_APPROVAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    
  }
}
