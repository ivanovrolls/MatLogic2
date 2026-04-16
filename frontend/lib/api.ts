import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ---- Auth ----
export const authApi = {
  register: (data: object) => api.post('/auth/register/', data),
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data: object) => api.patch('/auth/profile/', data),
}

// ---- Training Sessions ----
export const sessionsApi = {
  list: (params?: object) => api.get('/sessions/', { params }),
  get: (id: number) => api.get(`/sessions/${id}/`),
  create: (data: object) => api.post('/sessions/', data),
  update: (id: number, data: object) => api.patch(`/sessions/${id}/`, data),
  delete: (id: number) => api.delete(`/sessions/${id}/`),
  recent: () => api.get('/sessions/recent/'),
  stats: () => api.get('/sessions/stats/'),
}

// ---- Techniques ----
export const techniquesApi = {
  list: (params?: object) => api.get('/techniques/', { params }),
  get: (id: number) => api.get(`/techniques/${id}/`),
  create: (data: object) => api.post('/techniques/', data),
  update: (id: number, data: object) => api.patch(`/techniques/${id}/`, data),
  delete: (id: number) => api.delete(`/techniques/${id}/`),
  byPosition: (position?: string) =>
    api.get('/techniques/by_position/', { params: position ? { position } : {} }),
  incrementDrills: (id: number) =>
    api.post(`/techniques/${id}/increment_drills/`),
  // Chains
  listChains: () => api.get('/techniques/chains/'),
  getChain: (id: number) => api.get(`/techniques/chains/${id}/`),
  createChain: (data: object) => api.post('/techniques/chains/', data),
  updateChain: (id: number, data: object) => api.patch(`/techniques/chains/${id}/`, data),
  deleteChain: (id: number) => api.delete(`/techniques/chains/${id}/`),
  addToChain: (chainId: number, data: object) =>
    api.post(`/techniques/chains/${chainId}/add_technique/`, data),
  removeFromChain: (chainId: number, entryId: number) =>
    api.delete(`/techniques/chains/${chainId}/remove_technique/`, { data: { entry_id: entryId } }),
}

// ---- Sparring ----
export const sparringApi = {
  list: (params?: object) => api.get('/sparring/', { params }),
  get: (id: number) => api.get(`/sparring/${id}/`),
  create: (data: object) => api.post('/sparring/', data),
  update: (id: number, data: object) => api.patch(`/sparring/${id}/`, data),
  delete: (id: number) => api.delete(`/sparring/${id}/`),
  stats: () => api.get('/sparring/stats/'),
}

// ---- Planning ----
export const planningApi = {
  list: () => api.get('/planning/'),
  get: (id: number) => api.get(`/planning/${id}/`),
  current: () => api.get('/planning/current/'),
  create: (data: object) => api.post('/planning/', data),
  update: (id: number, data: object) => api.patch(`/planning/${id}/`, data),
  delete: (id: number) => api.delete(`/planning/${id}/`),
  generateChecklist: (planId: number, data: object) =>
    api.post(`/planning/${planId}/generate_checklist/`, data),
  // Checklists
  getChecklist: (id: number) => api.get(`/planning/checklists/${id}/`),
  updateChecklist: (id: number, data: object) =>
    api.patch(`/planning/checklists/${id}/`, data),
  toggleChecklistItem: (id: number, itemId: string) =>
    api.patch(`/planning/checklists/${id}/toggle_item/`, { item_id: itemId }),
}

// ---- Competition ----
export const competitionApi = {
  list: () => api.get('/competition/'),
  get: (id: number) => api.get(`/competition/${id}/`),
  create: (data: object) => api.post('/competition/', data),
  update: (id: number, data: object) => api.patch(`/competition/${id}/`, data),
  delete: (id: number) => api.delete(`/competition/${id}/`),
  // Matches
  createMatch: (data: object) => api.post('/competition/matches/', data),
  updateMatch: (id: number, data: object) => api.patch(`/competition/matches/${id}/`, data),
  deleteMatch: (id: number) => api.delete(`/competition/matches/${id}/`),
  // Game plans
  listGamePlans: (competitionId?: number) =>
    api.get('/competition/game-plans/', {
      params: competitionId ? { competition: competitionId } : {}
    }),
  createGamePlan: (data: object) => api.post('/competition/game-plans/', data),
  updateGamePlan: (id: number, data: object) =>
    api.patch(`/competition/game-plans/${id}/`, data),
}

// ---- Analytics ----
export const analyticsApi = {
  overview: (period?: string) =>
    api.get('/analytics/overview/', { params: period ? { period } : {} }),
  trainingTrends: (period?: string) =>
    api.get('/analytics/training-trends/', { params: period ? { period } : {} }),
  sparringStats: (period?: string) =>
    api.get('/analytics/sparring-stats/', { params: period ? { period } : {} }),
  techniqueAnalysis: (period?: string) =>
    api.get('/analytics/technique-analysis/', { params: period ? { period } : {} }),
  insights: () => api.get('/analytics/insights/'),
}

export default api
