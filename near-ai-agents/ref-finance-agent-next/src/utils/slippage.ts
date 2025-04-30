const DEFAULT_SLIPPAGE_TOLERANCE = 2; // 2%

export const getSlippageTolerance = (slippage?: string): number => {
  const tolerance = slippage ? Number.parseFloat(slippage) : null;
  if (tolerance === null || Number.isNaN(tolerance) || tolerance <= 0 || tolerance >= 100) {
    return DEFAULT_SLIPPAGE_TOLERANCE;
  }
  return tolerance;
}