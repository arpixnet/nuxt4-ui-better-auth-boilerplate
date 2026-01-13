import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthSession } from '~/composables/useAuthSession'

// Mock Better-Auth client
vi.mock('~/lib/auth-client', () => ({
  useAuthClient: () => ({
    getSession: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-1',
          userId: '1',
          expiresAt: new Date(Date.now() + 86400000), // 1 day
        },
      },
    }),
  }),
}))

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      betterAuth: {
        url: 'http://localhost:3000',
      },
    },
  }),
}))

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load session on mount', async () => {
    const { session, pending } = useAuthSession()
    
    expect(pending.value).toBe(true)
    
    // Wait for session to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(pending.value).toBe(false)
    expect(session.value).toBeDefined()
  })

  it('should expose user data from session', async () => {
    const { session } = useAuthSession()
    
    // Wait for session to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(session.value?.data?.user?.email).toBe('test@example.com')
    expect(session.value?.data?.user?.name).toBe('Test User')
  })
})
