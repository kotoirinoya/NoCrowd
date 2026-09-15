import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/api/client'
import {
  validateUsername,
  validatePassword,
  getUnmetPasswordRules,
  PASSWORD_RULES,
  USERNAME_MAX_LENGTH,
} from '@shared/validation'
import { loadSignupDraft, saveSignupDraft, clearSignupDraft } from '@/lib/signupDraft'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [showResumeDialog, setShowResumeDialog] = useState(false)

  const unmetPasswordRules = getUnmetPasswordRules(password)

  useEffect(() => {
    if (loadSignupDraft()) {
      setShowResumeDialog(true)
    }
  }, [])

  function handleResume(resume: boolean) {
    const draft = loadSignupDraft()
    if (resume && draft) {
      setUsername(draft.username)
    } else {
      clearSignupDraft()
    }
    setShowResumeDialog(false)
  }

  function handleUsernameChange(value: string) {
    setUsername(value)
    saveSignupDraft(value)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    const uError = validateUsername(username)
    const pError = validatePassword(password)
    const cError =
      confirmPassword.length === 0
        ? '入力が完了していません。'
        : confirmPassword !== password
          ? 'パスワードが一致しません。'
          : null

    setUsernameError(uError)
    setConfirmError(cError)

    if (uError || pError || cError) return

    setSubmitting(true)
    try {
      await signup(username.trim(), password)
      clearSignupDraft()
      navigate('/onboarding')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '登録に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-page">
      <h1>会員登録</h1>

      {showResumeDialog && (
        <div className="dialog-backdrop">
          <div className="dialog">
            <p>途中から続けますか？</p>
            <div className="dialog__actions">
              <button type="button" onClick={() => handleResume(true)}>
                Yes
              </button>
              <button type="button" onClick={() => handleResume(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <label>
          ユーザー名（半角英数字・.（ピリオド）・_（アンダースコア）のみ、{USERNAME_MAX_LENGTH}字以内）
          <input
            type="text"
            value={username}
            maxLength={USERNAME_MAX_LENGTH}
            onChange={(e) => handleUsernameChange(e.target.value)}
          />
        </label>
        {usernameError && <p className="field-error">{usernameError}</p>}

        <label>
          パスワード
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <ul className="password-rules">
          {PASSWORD_RULES.map((rule) => {
            const unmet = unmetPasswordRules.some((r) => r.key === rule.key)
            return (
              <li key={rule.key} className={unmet ? 'password-rules__item password-rules__item--unmet' : 'password-rules__item'}>
                {rule.label}
              </li>
            )
          })}
        </ul>

        <label>
          パスワード（確認）
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        {confirmError && <p className="field-error">{confirmError}</p>}

        {formError && <p className="field-error">{formError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? '登録中...' : '登録する'}
        </button>
      </form>
    </div>
  )
}
