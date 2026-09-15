import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient, ApiError } from '@/api/client'

export function ShopLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('入力が完了していません。')
      return
    }
    setSubmitting(true)
    try {
      await apiClient.post('/shop-auth/login', { username, password })
      navigate('/shop/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ログインに失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-page">
      <h1>店舗ログイン</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          店舗アカウント名
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          パスワード
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <p>
        <Link to="/">トップに戻る</Link>
      </p>
    </div>
  )
}
