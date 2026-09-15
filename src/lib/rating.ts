export function formatRating(average: number | null, count: number): string {
  if (average === null || count === 0) return '評価なし'
  const rounded = Math.round(average)
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)} (${count})`
}
