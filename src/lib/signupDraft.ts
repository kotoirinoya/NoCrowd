// 登録が中断された場合に備え、ユーザー名のみをlocalStorageに保存する（パスワードは保存しない）
const DRAFT_KEY = 'nocrowd_signup_draft'

interface SignupDraft {
  username: string
}

export function saveSignupDraft(username: string): void {
  if (!username) {
    clearSignupDraft()
    return
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ username } satisfies SignupDraft))
}

export function loadSignupDraft(): SignupDraft | null {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed?.username === 'string') return parsed as SignupDraft
    return null
  } catch {
    return null
  }
}

export function clearSignupDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}
