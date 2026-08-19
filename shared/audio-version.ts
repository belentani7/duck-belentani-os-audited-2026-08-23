export function filterAssetsForProject<T extends { projectId: number }>(assets: T[], projectId: number) {
  return assets.filter((asset) => asset.projectId === projectId);
}

export function nextVersionNumber(existingCount: number) {
  return Math.max(1, existingCount + 1);
}
