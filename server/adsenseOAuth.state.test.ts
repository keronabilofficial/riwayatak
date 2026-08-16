import { describe, expect, it } from "vitest";
import { signState, verifyState } from "./adsenseOAuth";

describe("حالة ربط AdSense عبر OAuth", () => {
  it("تحافظ على هوية مدير النظام عند العودة عبر نطاق مختلف وتمنع العبث بها", () => {
    const state = signState(1);
    expect(verifyState(state)).toBe(1);
    expect(verifyState(`${state}tampered`)).toBeNull();
    expect(verifyState("not-a-valid-state")).toBeNull();
  });
});
