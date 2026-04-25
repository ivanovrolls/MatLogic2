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
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.patch('/auth/profile/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  // Weight tracking
  listWeight: () => api.get('/auth/weight/'),
  addWeight: (data: object) => api.post('/auth/weight/', data),
  deleteWeight: (id: number) => api.delete(`/auth/weight/${id}/`),
  // Mat Wall posts
  listPosts: () => api.get('/auth/posts/'),
  createPost: (form: FormData) => api.post('/auth/posts/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deletePost: (id: number) => api.delete(`/auth/posts/${id}/`),
  getUserPosts: (username: string) => api.get(`/auth/users/${username}/posts/`),
  // Public profile
  getPublicProfile: (username: string) => api.get(`/auth/users/${username}/`),
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

// ---- Session Templates ----
export const templatesApi = {
  list: () => api.get('/sessions/templates/'),
  create: (data: object) => api.post('/sessions/templates/', data),
  update: (id: number, data: object) => api.patch(`/sessions/templates/${id}/`, data),
  delete: (id: number) => api.delete(`/sessions/templates/${id}/`),
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

// ---- Coaching ----
export const coachingApi = {
  // Student side
  getRelationship: () => api.get('/coaching/relationship/'),
  requestCoach: (coach_username: string) => api.post('/coaching/relationship/', { coach_username }),
  removeCoach: () => api.delete('/coaching/relationship/'),
  getMyDrillingPlans: () => api.get('/coaching/drilling-plans/'),
  // Coach side
  getRequests: () => api.get('/coaching/requests/'),
  respondToRequest: (id: number, status: 'accepted' | 'declined') =>
    api.patch(`/coaching/requests/${id}/respond/`, { status }),
  getStudents: () => api.get('/coaching/students/'),
  getStudentData: (studentId: number, type?: string) =>
    api.get(`/coaching/students/${studentId}/`, { params: type ? { type } : {} }),
  assignTechnique: (studentId: number, data: object) =>
    api.post(`/coaching/students/${studentId}/assign-technique/`, data),
  getStudentDrillingPlans: (studentId: number) =>
    api.get(`/coaching/students/${studentId}/drilling-plans/`),
  createDrillingPlan: (studentId: number, data: object) =>
    api.post(`/coaching/students/${studentId}/drilling-plans/`, data),
  // Technique respond (student)
  respondToCoachTechnique: (id: number, action: 'accept' | 'decline') =>
    api.post(`/techniques/${id}/respond-coach/`, { action }),
  // Session notes (coach)
  getStudentSessionNotes: (studentId: number) =>
    api.get(`/coaching/students/${studentId}/session-notes/`),
  saveSessionNote: (studentId: number, sessionId: number, note: string) =>
    api.post(`/coaching/students/${studentId}/sessions/${sessionId}/notes/`, { note }),
  deleteSessionNote: (studentId: number, sessionId: number) =>
    api.delete(`/coaching/students/${studentId}/sessions/${sessionId}/notes/`),
  // Session notes (student)
  getMySessionNotes: (sessionId?: number) =>
    api.get('/coaching/session-notes/', { params: sessionId ? { session_id: sessionId } : {} }),
  // Drill check-in (student)
  drillCheckIn: (planId: number, data: object) =>
    api.patch(`/coaching/drilling-plans/${planId}/check-in/`, data),
  // Remove student (coach)
  removeStudent: (studentId: number) =>
    api.delete(`/coaching/students/${studentId}/remove/`),
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
  autoGenerate: () => api.post('/planning/auto_generate/'),
  saveAsTemplate: (planId: number, data: object) =>
    api.post(`/planning/${planId}/save_as_template/`, data),
  generateChecklist: (planId: number, data: object) =>
    api.post(`/planning/${planId}/generate_checklist/`, data),
  // Checklists
  getChecklist: (id: number) => api.get(`/planning/checklists/${id}/`),
  createChecklist: (data: object) => api.post('/planning/checklists/', data),
  updateChecklist: (id: number, data: object) =>
    api.patch(`/planning/checklists/${id}/`, data),
  deleteChecklist: (id: number) => api.delete(`/planning/checklists/${id}/`),
  toggleChecklistItem: (id: number, itemId: string) =>
    api.patch(`/planning/checklists/${id}/toggle_item/`, { item_id: itemId }),
  // Plan templates
  listTemplates: () => api.get('/planning/templates/'),
  deleteTemplate: (id: number) => api.delete(`/planning/templates/${id}/`),
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

// ---- Injuries ----
export const injuriesApi = {
  list: (params?: object) => api.get('/injuries/', { params }),
  get: (id: number) => api.get(`/injuries/${id}/`),
  create: (data: object) => api.post('/injuries/', data),
  update: (id: number, data: object) => api.patch(`/injuries/${id}/`, data),
  delete: (id: number) => api.delete(`/injuries/${id}/`),
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

// ---- Notifications ----
export const notificationsApi = {
  subscribe: (data: object) => api.post('/notifications/subscribe/', data),
  unsubscribe: (endpoint: string) => api.post('/notifications/unsubscribe/', { endpoint }),
  list: () => api.get('/notifications/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
  markRead: (id: number) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
}

// ---- Social ----
export const socialApi = {
  dojo: () => api.get('/social/dojo/'),
  rivals: () => api.get('/social/rivals/'),
  search: (q: string) => api.get('/social/search/', { params: { q } }),
  getProfile: (username: string) => api.get(`/social/users/${username}/`),
  sendChallenge: (username: string, data: object) =>
    api.post(`/social/users/${username}/challenge/`, data),
  respondChallenge: (id: number, action: 'accept' | 'decline') =>
    api.post(`/social/challenges/${id}/respond/`, { action }),
  myChallenges: () => api.get('/social/challenges/'),
  gymSearch: (q: string) => api.get('/social/gyms/', { params: { q } }),
  gymCreate: (data: { name: string; aliases: string }) => api.post('/social/gyms/create/', data),
}

export default api
