import type { Overlap } from '../shared/overlap'
import type { Content, ContentInput } from '../shared/content'
import type { Report } from '../shared/metrics'
import type { ReportInput } from '../shared/schema'
import type { PublicUser, Role } from '../shared/users'
import type { Activity, ActivityInput } from '../shared/activity'
import type { Ad, AdInput } from '../shared/ad'
import type { MapsInput, MapsReport } from '../shared/maps'
import type { WaInput, WaReport } from '../shared/whatsapp'
import type { WebInput, WebReport } from '../shared/website'
import type { Reservation, ReservationInput } from '../shared/reservation'
import type { Influencer, InfluencerInput } from '../shared/influencer'
import type { SummaryInput, SummaryItem } from '../shared/summary'
import type { analyze } from '../server/analytics'

export type Analysis = ReturnType<typeof analyze>
export interface SaveResult { report: Report; warnings: Overlap[] }
export interface Audit { change_id: string; report_id: string; changed_at: string; action: string; before_json: string; after_json: string }

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response
  try {
    r = await fetch('/api' + path, { headers: { 'content-type': 'application/json' }, ...init })
  } catch {
    throw new Error('Server tidak dapat dihubungi. Periksa koneksi internet lalu coba lagi.')
  }
  if (!r.ok) {
    if (r.status === 401 && !path.startsWith('/auth/')) dispatchEvent(new Event('auth-expired'))
    const j = await r.json().catch(() => ({}))
    throw new Error(j.error ?? `Permintaan gagal (${r.status})`)
  }
  return (r.status === 204 ? undefined : await r.json()) as T
}
const body = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) })

export const thumbUrl = (file: string) => `/api/thumbs/${file}`

export const api = {
  health: () => req<{ ok: boolean; file: string }>('/health', { signal: AbortSignal.timeout(8000) }),
  reports: () => req<Report[]>('/reports'),
  create: (d: ReportInput) => req<SaveResult>('/reports', body('POST', d)),
  continueReport: (id: string, d: ReportInput) => req<SaveResult>(`/reports/${id}/continue`, body('POST', d)),
  update: (id: string, d: ReportInput) => req<SaveResult>(`/reports/${id}`, body('PUT', d)),
  remove: (id: string) => req<void>(`/reports/${id}`, body('DELETE')),
  /** Unggah gambar sampul: badan = isi file mentah, jenis dari Content-Type. */
  uploadThumb: (blob: Blob) => req<{ file: string }>('/thumbs', { method: 'POST', headers: { 'content-type': blob.type }, body: blob }),
  deleteThumb: (file: string) => req<void>(`/thumbs/${file}`, body('DELETE')),
  contents: () => req<Content[]>('/contents'),
  addContent: (d: ContentInput) => req<Content>('/contents', body('POST', d)),
  updateContent: (id: string, d: ContentInput) => req<Content>(`/contents/${id}`, body('PUT', d)),
  removeContent: (id: string) => req<void>(`/contents/${id}`, body('DELETE')),
  analytics: (q: Record<string, string>) => req<Analysis>('/analytics?' + new URLSearchParams(q)),
  settings: () => req<{ settings: Record<string, string>; file: string }>('/settings'),
  saveSettings: (s: Record<string, string>) => req<void>('/settings', body('PUT', s)),
  audit: () => req<Audit[]>('/audit'),
  maps: () => req<MapsReport[]>('/maps'),
  saveMaps: (d: MapsInput) => req<MapsReport>('/maps', body('PUT', d)),
  removeMaps: (id: string) => req<void>(`/maps/${id}`, body('DELETE')),
  web: () => req<WebReport[]>('/web'),
  saveWeb: (d: WebInput) => req<WebReport>('/web', body('PUT', d)),
  removeWeb: (id: string) => req<void>(`/web/${id}`, body('DELETE')),
  wa: () => req<WaReport[]>('/whatsapp'),
  saveWa: (d: WaInput) => req<WaReport>('/whatsapp', body('PUT', d)),
  removeWa: (id: string) => req<void>(`/whatsapp/${id}`, body('DELETE')),
  reservations: () => req<Reservation[]>('/reservations'),
  addReservation: (d: ReservationInput) => req<Reservation>('/reservations', body('POST', d)),
  updateReservation: (id: string, d: ReservationInput) => req<Reservation>(`/reservations/${id}`, body('PUT', d)),
  removeReservation: (id: string) => req<void>(`/reservations/${id}`, body('DELETE')),
  ads: (account: string) => req<Ad[]>(`/ads?account=${account}`),
  addAd: (d: AdInput) => req<Ad>('/ads', body('POST', d)),
  removeAd: (id: string) => req<void>(`/ads/${id}`, body('DELETE')),
  influencers: () => req<Influencer[]>('/influencers'),
  addInfluencer: (d: InfluencerInput) => req<Influencer>('/influencers', body('POST', d)),
  updateInfluencer: (id: string, d: InfluencerInput) => req<Influencer>(`/influencers/${id}`, body('PUT', d)),
  removeInfluencer: (id: string) => req<void>(`/influencers/${id}`, body('DELETE')),
  activities: () => req<Activity[]>('/activities'),
  addActivity: (d: ActivityInput) => req<Activity>('/activities', body('POST', d)),
  updateActivity: (id: string, d: ActivityInput) => req<Activity>(`/activities/${id}`, body('PUT', d)),
  removeActivity: (id: string) => req<void>(`/activities/${id}`, body('DELETE')),
  summary: () => req<SummaryItem[]>('/summary'),
  addSummary: (d: SummaryInput) => req<SummaryItem>('/summary', body('POST', d)),
  updateSummary: (id: string, d: SummaryInput) => req<SummaryItem>(`/summary/${id}`, body('PUT', d)),
  removeSummary: (id: string) => req<void>(`/summary/${id}`, body('DELETE')),
  authState: () => req<{ needsSetup: boolean; user: PublicUser | null }>('/auth/state'),
  login: (username: string, password: string) => req<{ user: PublicUser }>('/auth/login', body('POST', { username, password })),
  setup: (username: string, password: string) => req<{ user: PublicUser }>('/auth/setup', body('POST', { username, password })),
  logout: () => req<void>('/auth/logout', body('POST')),
  users: () => req<PublicUser[]>('/users'),
  addUser: (d: { username: string; password: string; role: Role }) => req<PublicUser>('/users', body('POST', d)),
  setPassword: (id: string, password: string) => req<void>(`/users/${id}/password`, body('PUT', { password })),
  removeUser: (id: string) => req<void>(`/users/${id}`, body('DELETE')),
}
