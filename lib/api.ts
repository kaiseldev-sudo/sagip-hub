export interface ApiError extends Error {
  status?: number
  path?: string
}

export interface ApiRequestCreate {
  title: string
  description: string
  latitude: number
  longitude: number
  contactNumber: string
  requestType: string
  urgency: string
  peopleAffected: number
}

export interface ApiRequest {
  public_id: string
  title: string
  description: string
  latitude: number
  longitude: number
  contact_number: string
  request_type: string
  urgency: string
  people_affected: number
  created_at: string
  status?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost/relief-hub/public"

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    // some endpoints may return empty
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
  }
  let message = `HTTP ${res.status}`
  let path: string | undefined
  try {
    const data = (await res.json()) as { error?: string; path?: string }
    if (data?.error) message = data.error
    if (data?.path) path = data.path
  } catch {}
  const err: ApiError = new Error(message)
  err.status = res.status
  if (path) err.path = path
  throw err
}

export async function apiHealth(): Promise<{ status: string } | undefined> {
  const res = await fetch(`${BASE_URL}/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
  })
  return handleResponse(res)
}

export interface ListParams {
  page?: number
  per_page?: number
  bbox?: [number, number, number, number]
}

export async function apiListRequests(params: ListParams = {}): Promise<{ data: ApiRequest[]; page?: number; per_page?: number; total?: number } | ApiRequest[]> {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.per_page) search.set("per_page", String(params.per_page))
  if (params.bbox) search.set("bbox", params.bbox.join(","))
  const qs = search.toString()
  const url = `${BASE_URL}/requests${qs ? `?${qs}` : ""}`
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
  })
  return handleResponse(res)
}

export async function apiGetRequest(publicId: string): Promise<ApiRequest> {
  const res = await fetch(`${BASE_URL}/requests/${encodeURIComponent(publicId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
  })
  return handleResponse(res)
}

export interface CreateResponse {
  request: ApiRequest
  edit_token?: string
}

export async function apiCreateRequest(payload: ApiRequestCreate): Promise<CreateResponse> {
  const res = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      latitude: payload.latitude,
      longitude: payload.longitude,
      contact_number: payload.contactNumber,
      request_type: payload.requestType,
      urgency: payload.urgency,
      people_affected: payload.peopleAffected,
    }),
  })
  return handleResponse(res)
}

export async function apiWithdrawRequest(publicId: string, editToken: string): Promise<{ success: boolean } | undefined> {
  const res = await fetch(`${BASE_URL}/requests/${encodeURIComponent(publicId)}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify({ edit_token: editToken }),
  })
  return handleResponse(res)
}


