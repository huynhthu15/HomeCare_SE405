import api from './api'

export type User = {
  id: string
  name: string
  email: string
  role?: string
}

export type AuthResponse = {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post('/auth/login', { email, password })
  return response.data as AuthResponse
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await api.post('/auth/register', { name, email, password })
  return response.data as AuthResponse
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get('/auth/me')
  return response.data.user as User
}
