import calibrationFixture from "../fixtures/estimation-calibration-sample.json";
import { describe, expect, it } from "vitest";
import { calibrateEstimationSettings } from "../../app/utils/expense-estimation-calibration";

describe("expense estimation calibration", () => {
  it("derives a stable fixed-fee-plus-markup baseline from fixture data", () => {
    const result = calibrateEstimationSettings(calibrationFixture);

    expect(result.sampleCount).toBe(6);
    expect(result.currencies).toEqual(["GBP"]);
    expect(result.recommendedSettings.defaultMarkupBps).toBe(75);
    expect(result.recommendedSettings.fixedFeeCents).toBe(109);
    expect(result.recommendedSettings.weekendSurchargeBps).toBe(0);
    expect(result.fixedFeeEur).toBeCloseTo(1.09, 2);
    expect(result.markupPercent).toBeCloseTo(0.75, 2);
    expect(result.metrics.mae).toBeLessThan(0.03);
  });
});
