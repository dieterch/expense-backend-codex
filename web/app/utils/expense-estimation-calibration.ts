import type { EstimationSettings } from "./expense-estimation";

export type CalibrationSample = {
  currency: string;
  referenceEurAmount: number;
  actualEurAmount: number;
  date?: string | null;
};

export type CalibrationResult = {
  sampleCount: number;
  currencies: string[];
  recommendedSettings: EstimationSettings;
  fixedFeeEur: number;
  markupPercent: number;
  metrics: {
    mae: number;
    rmse: number;
  };
  weekendSampleCount: number;
};

function fitLinear(xs: number[], ys: number[]) {
  const n = xs.length;
  const sumX = xs.reduce((sum, value) => sum + value, 0);
  const sumY = ys.reduce((sum, value) => sum + value, 0);
  const sumXY = xs.reduce((sum, value, index) => sum + value * ys[index], 0);
  const sumX2 = xs.reduce((sum, value) => sum + value * value, 0);
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) {
    return {
      slope: 0,
      intercept: sumY / Math.max(n, 1),
    };
  }

  return {
    slope: (n * sumXY - sumX * sumY) / denominator,
    intercept: (sumY - ((n * sumXY - sumX * sumY) / denominator) * sumX) / n,
  };
}

function toBps(decimalRate: number) {
  return Math.max(0, Math.round(decimalRate * 10_000));
}

function toCents(amount: number) {
  return Math.max(0, Math.round(amount * 100));
}

function isWeekend(value?: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function calibrateEstimationSettings(samples: CalibrationSample[]): CalibrationResult {
  const usableSamples = samples.filter((sample) =>
    sample.currency &&
    Number.isFinite(sample.referenceEurAmount) &&
    sample.referenceEurAmount > 0 &&
    Number.isFinite(sample.actualEurAmount) &&
    sample.actualEurAmount > 0,
  );

  if (!usableSamples.length) {
    throw new Error("No usable calibration samples were provided");
  }

  const referenceAmounts = usableSamples.map((sample) => sample.referenceEurAmount);
  const differences = usableSamples.map((sample) => sample.actualEurAmount - sample.referenceEurAmount);
  const fit = fitLinear(referenceAmounts, differences);

  const fixedFeeEur = Math.max(0, fit.intercept);
  const markupPercent = Math.max(0, fit.slope * 100);
  const recommendedSettings: EstimationSettings = {
    defaultMarkupBps: toBps(fit.slope),
    fixedFeeCents: toCents(fixedFeeEur),
    weekendSurchargeBps: 0,
    currencyMarkupOverrides: {},
  };

  let absoluteError = 0;
  let squaredError = 0;
  for (const sample of usableSamples) {
    const predicted =
      sample.referenceEurAmount +
      fixedFeeEur +
      sample.referenceEurAmount * fit.slope;
    const error = predicted - sample.actualEurAmount;
    absoluteError += Math.abs(error);
    squaredError += error * error;
  }

  return {
    sampleCount: usableSamples.length,
    currencies: Array.from(new Set(usableSamples.map((sample) => sample.currency))).sort(),
    recommendedSettings,
    fixedFeeEur,
    markupPercent,
    metrics: {
      mae: absoluteError / usableSamples.length,
      rmse: Math.sqrt(squaredError / usableSamples.length),
    },
    weekendSampleCount: usableSamples.filter((sample) => isWeekend(sample.date)).length,
  };
}
