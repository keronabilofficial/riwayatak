import { describe, expect, it } from "vitest";
import { canRedeemPoints, getPointStoreItem, pointStoreItems } from "./pointsStore";

describe("points store", () => {
  it("exposes only platform-owned badges and perks with explicit costs", () => {
    expect(pointStoreItems).toHaveLength(4);
    expect(pointStoreItems.every(item => item.cost > 0 && item.title.length > 0)).toBe(true);
  });

  it("checks balance before redemption", () => {
    const reward = getPointStoreItem("reader_badge");
    expect(reward).toBeDefined();
    expect(canRedeemPoints(reward!.cost - 1, reward!.cost)).toBe(false);
    expect(canRedeemPoints(reward!.cost, reward!.cost)).toBe(true);
  });

  it("does not resolve unknown reward keys", () => {
    expect(getPointStoreItem("unknown")).toBeUndefined();
  });
});
