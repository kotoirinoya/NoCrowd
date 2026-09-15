import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { uploadImage } from '@/lib/uploadImage'
import { buildProfilePatch } from '@/lib/buildProfilePatch'
import { ProfileFields, EMPTY_PROFILE_FIELDS, type ProfileFieldValues } from '@/components/ProfileFields'
import { AvatarIllustration } from '@/components/AvatarIllustration'
import type { PostDTO, UserDTO } from '@shared/types'

function toFieldValues(user: UserDTO): ProfileFieldValues {
  return {
    phone: user.phone ?? '',
    email: user.email ?? '',
    age: user.age !== null ? String(user.age) : '',
    schoolType: user.schoolType ?? '',
    schoolName: user.schoolName ?? '',
    gender: user.gender ?? '',
    birthday: user.birthday ? user.birthday.slice(0, 10) : '',
  }
}

export function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const [values, setValues] = useState<ProfileFieldValues>(EMPTY_PROFILE_FIELDS)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [posts, setPosts] = useState<PostDTO[] | null>(null)

  useEffect(() => {
    if (!user) return
    setValues(toFieldValues(user))
    setAvatarUrl(user.avatarUrl)
  }, [user])

  useEffect(() => {
    apiClient
      .get<PostDTO[]>('/posts?mine=1')
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [])

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
    setSaved(false)
    try {
      const patch = buildProfilePatch(values, avatarUrl)
      const updated = await apiClient.patch<UserDTO>('/users/me', patch)
      setUser(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <p>読み込み中...</p>

  return (
    <div className="page">
      <header className="page__header">
        <h1>プロフィール</h1>
        <button type="button" onClick={() => logout()}>
          ログアウト
        </button>
      </header>

      <div className="onboarding-page__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt="プロフィール画像" className="onboarding-page__avatar-img" />
        ) : (
          <AvatarIllustration seed={user.username} size={80} />
        )}
        <label className="button">
          {uploading ? 'アップロード中...' : '写真を変更'}
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={uploading} />
        </label>
      </div>

      <p className="profile-page__username">@{user.username}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <ProfileFields values={values} onChange={setValues} />
        {error && <p className="field-error">{error}</p>}
        {saved && <p className="notice">保存しました。</p>}
        <button type="submit" disabled={saving || uploading}>
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>

      <h2>投稿一覧</h2>
      {posts === null && <p>読み込み中...</p>}
      {posts?.length === 0 && <p>まだ投稿がありません。</p>}
      <div className="post-grid">
        {posts?.map((post) => (
          <div key={post.id} className="post-grid__item">
            <img src={post.photoUrl} alt={post.comment} />
            <p className="post-grid__shop">{post.shop.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
