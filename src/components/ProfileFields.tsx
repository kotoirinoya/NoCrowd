import type { Gender, SchoolType } from '@shared/types'
import { formatPhoneInput } from '@/lib/phoneFormat'

export interface ProfileFieldValues {
  phone: string
  email: string
  age: string
  schoolType: SchoolType | ''
  schoolName: string
  gender: Gender | ''
  birthday: string
}

export const EMPTY_PROFILE_FIELDS: ProfileFieldValues = {
  phone: '',
  email: '',
  age: '',
  schoolType: '',
  schoolName: '',
  gender: '',
  birthday: '',
}

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: '未選択' },
  { value: 'MALE', label: '男性' },
  { value: 'FEMALE', label: '女性' },
  { value: 'OTHER', label: 'その他' },
  { value: 'UNSPECIFIED', label: '回答しない' },
]

const SCHOOL_TYPE_OPTIONS: { value: SchoolType | ''; label: string }[] = [
  { value: '', label: '未選択' },
  { value: 'ELEMENTARY', label: '小学校' },
  { value: 'JUNIOR_HIGH', label: '中学校' },
  { value: 'HIGH_SCHOOL', label: '高校' },
  { value: 'UNIVERSITY', label: '大学' },
  { value: 'VOCATIONAL', label: '専門学校' },
  { value: 'OTHER', label: 'その他' },
]

const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => i + 1)

export function ProfileFields({
  values,
  onChange,
}: {
  values: ProfileFieldValues
  onChange: (values: ProfileFieldValues) => void
}) {
  function set<K extends keyof ProfileFieldValues>(key: K, value: ProfileFieldValues[K]) {
    onChange({ ...values, [key]: value })
  }

  return (
    <>
      <label>
        電話番号（000-0000-0000の形式）
        <input
          type="tel"
          value={values.phone}
          onChange={(e) => set('phone', formatPhoneInput(e.target.value))}
        />
      </label>
      <label>
        メールアドレス
        <input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
      </label>
      <label>
        年齢（入力 or 一覧から選択）
        <input
          type="number"
          min={0}
          max={120}
          list="age-options"
          value={values.age}
          onChange={(e) => set('age', e.target.value)}
        />
        <datalist id="age-options">
          {AGE_OPTIONS.map((age) => (
            <option key={age} value={age} />
          ))}
        </datalist>
      </label>
      <label>
        学校種別
        <select
          value={values.schoolType}
          onChange={(e) => set('schoolType', e.target.value as SchoolType | '')}
        >
          {SCHOOL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        学校名
        <input type="text" value={values.schoolName} onChange={(e) => set('schoolName', e.target.value)} />
      </label>
      <label>
        性別
        <select value={values.gender} onChange={(e) => set('gender', e.target.value as Gender | '')}>
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        誕生日
        <input type="date" value={values.birthday} onChange={(e) => set('birthday', e.target.value)} />
      </label>
    </>
  )
}
