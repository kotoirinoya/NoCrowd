import { apiClient } from '@/api/client'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  const result = await apiClient.post<{ url: string }>('/uploads', { dataUrl, filename: file.name })
  return result.url
}
