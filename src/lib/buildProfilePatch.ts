import type { ProfileFieldValues } from '@/components/ProfileFields'

export function buildProfilePatch(values: ProfileFieldValues, avatarUrl: string | null | undefined) {
  return {
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    age: values.age.trim() ? Number(values.age) : null,
    schoolType: values.schoolType || null,
    schoolName: values.schoolName.trim() || null,
    gender: values.gender || null,
    birthday: values.birthday || null,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  }
}
