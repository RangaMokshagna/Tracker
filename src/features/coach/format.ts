const finitePositive = (n: number) => Number.isFinite(n) && n > 0;
export function pace(seconds: number): string {
  if (!finitePositive(seconds)) return "—";
  const n = Math.round(seconds);
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}
