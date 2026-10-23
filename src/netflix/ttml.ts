export function parseTickTime(value: string, tickRate: number): number {
  return Math.round((Number.parseInt(value, 10) / tickRate) * 1000);
}
