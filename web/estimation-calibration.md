# Estimation Calibration Notes

This baseline was derived from the local `ausgaben.xlsx` workbook on March 27, 2026.

Observed workbook shape:

- 1 sheet: `ausgaben`
- 95 rows total
- 92 usable expense rows after filtering out summary/invalid rows
- usable rows were all `GBP`
- usable date range: June 10, 2025 to June 30, 2025
- no usable weekend rows were present, so weekend surcharge remains `0`

Recommended initial profile:

- default markup: `75` bps (`0.75%`)
- fixed fee: `109` cents (`EUR 1.09`)
- weekend surcharge: `0` bps

Why this profile:

- a pure percentage model overstated larger payments and understated smaller ones
- a pure fixed-fee model missed the slight size-based uplift visible on larger rows
- a simple mixed model `reference_eur + fixed_fee + markup` matched the workbook best while staying explainable

Interpretation:

- the workbook strongly suggests the bank/card cost pattern is dominated by a nearly constant per-transaction fee
- there is still a small proportional spread on top of the fixed fee
- because the source data is GBP-only, the default should be treated as a provisional cross-currency fallback until more currencies are observed

Confidence notes:

- confidence is moderate for small and medium GBP transactions because the workbook is dense there
- confidence is weaker for weekend adjustments because no usable weekend sample rows were present
- confidence is weaker for non-GBP currencies because the workbook did not contain them in usable form

Reproducibility:

- the app defaults in [expense-estimation.ts](/home/developer/projects/expense-backend-codex/web/app/utils/expense-estimation.ts#L1) were updated to this baseline
- the calibration logic is tested in [expense-estimation-calibration.spec.ts](/home/developer/projects/expense-backend-codex/web/tests/unit/expense-estimation-calibration.spec.ts#L1) against a representative fixture
