import { randomInt } from 'node:crypto'

// 充電切れ等でスマホを操作できない時に、店員へ口頭で伝えるための短い予約番号
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function generateReservationCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS[randomInt(CODE_CHARS.length)]
  }
  return code
}
