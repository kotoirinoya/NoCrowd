import { NG_WORDS } from './ngWords'

export const USERNAME_MAX_LENGTH = 15
export const PASSWORD_MIN_LENGTH = 10

// Instagram風: 英数字・ピリオド・アンダースコアのみ（大文字可）
const USERNAME_ALLOWED_PATTERN = /^[A-Za-z0-9._]+$/

export function validateUsername(rawUsername: string): string | null {
  const username = rawUsername.trim()
  if (username.length === 0) {
    return '入力が完了していません。'
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `ユーザー名は${USERNAME_MAX_LENGTH}字以内で入力してください。`
  }
  if (!USERNAME_ALLOWED_PATTERN.test(username)) {
    return '半角英数字・.（ピリオド）・_（アンダースコア）のみ使用できます。'
  }
  const lower = username.toLowerCase()
  if (NG_WORDS.some((word) => lower.includes(word))) {
    return '不適切な単語が含まれています。'
  }
  return null
}

export interface PasswordRule {
  key: 'length' | 'uppercase' | 'lowercase' | 'symbol'
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: 'length',
    label: `${PASSWORD_MIN_LENGTH}文字以上`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: 'uppercase',
    label: '大文字を1つ以上',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: 'lowercase',
    label: '小文字を1つ以上',
    test: (p) => /[a-z]/.test(p),
  },
  {
    key: 'symbol',
    label: '記号を1つ以上',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
]

// 未達成のパスワードルールを返す（すべて満たしていれば空配列）
export function getUnmetPasswordRules(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password))
}

export function validatePassword(rawPassword: string): string | null {
  if (rawPassword.length === 0) {
    return '入力が完了していません。'
  }
  const unmet = getUnmetPasswordRules(rawPassword)
  if (unmet.length > 0) {
    return unmet.map((r) => r.label).join(' / ') + ' を満たしていません。'
  }
  return null
}
