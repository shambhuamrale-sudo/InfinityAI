const raw = import.meta.env.VITE_API_BASE_URL || '/api'
export const API_BASE = raw.endsWith('/api') ? raw : `${raw}/api`
