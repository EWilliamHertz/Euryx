// Standard ELO with K=32, floor at 100.
export function elo(prevA: number, prevB: number, aWon: boolean, k = 32) {
  const ea = 1 / (1 + Math.pow(10, (prevB - prevA) / 400));
  const eb = 1 - ea;
  const sa = aWon ? 1 : 0;
  const sb = aWon ? 0 : 1;
  const newA = Math.max(100, Math.round(prevA + k * (sa - ea)));
  const newB = Math.max(100, Math.round(prevB + k * (sb - eb)));
  return { newA, newB, deltaA: newA - prevA, deltaB: newB - prevB };
}
