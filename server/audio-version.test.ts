import { describe, expect, it } from "vitest";
import { filterAssetsForProject, nextVersionNumber } from "../shared/audio-version";

describe("audio versioning", () => {
  it("isola assets pelo projeto e incrementa versões", () => {
    const assets = [{ id: 1, projectId: 9 }, { id: 2, projectId: 8 }, { id: 3, projectId: 9 }];
    expect(filterAssetsForProject(assets, 9).map((asset) => asset.id)).toEqual([1, 3]);
    expect(filterAssetsForProject(assets, 8).map((asset) => asset.id)).toEqual([2]);
    expect(nextVersionNumber(0)).toBe(1);
    expect(nextVersionNumber(3)).toBe(4);
  });
});
