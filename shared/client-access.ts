export function canAccessClientPortal(user: { id: number } | null | undefined) {
  return Boolean(user?.id);
}
