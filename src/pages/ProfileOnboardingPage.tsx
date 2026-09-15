import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, ApiError } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { uploadImage } from '@/lib/uploadImage'
import { buildProfilePatch } from '@/lib/buildProfilePatch'
import { ProfileFields, EMPTY_PROFILE_FIELDS, type ProfileFieldValues } from '@/components/ProfileFields'
import { AvatarIllustration } from '@/components/AvatarIllustration'
import type { UserDTO } from '@shared/types'

export function ProfileOnboardingPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [values, setValues] = useState<ProfileFieldValues>(EMPTY_PROFILE_FIELDS)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      setAvatarUrl(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '画像のアップロードに失敗しました。')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const patch = buildProfilePatch(values, avatarUrl ?? undefined)
      const updated = await apiClient.patch<UserDTO>('/users/me', patch)
      setUser(updated)
      navigate('/search')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    navigate('/search')
  }

  return (
    <div className="page onboarding-page">
      <h1>プロフィールを設定しましょう</h1>
      <p className="notice">あとからいつでも「プロフィール」タブで変更できます。</p>

      <div className="onboarding-page__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt="プロフィール画像" className="onboarding-page__avatar-img" />
        ) : (
          <AvatarIllustration seed={user?.username ?? 'guest'} size={80} />
        )}
        <label className="button">
          {uploading ? 'アップロード中...' : '写真を選ぶ'}
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={uploading} />
        </label>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <ProfileFields values={values} onChange={setValues} />
        {error && <p className="field-error">{error}</p>}
        <div className="onboarding-page__actions">
          <button type="submit" disabled={saving || uploading}>
            {saving ? '保存中...' : '保存する'}
          </button>
          <button type="button" className="button" onClick={handleSkip}>
            スキップ
          </button>
        </div>
      </form>
    </div>
  )
}
