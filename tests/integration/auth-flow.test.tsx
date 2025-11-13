import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from '@/hooks/useLogin'
import { useProfile } from '@/hooks/useProfile'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/lib/api'
import * as auth from '@/lib/auth'
import toast from 'react-hot-toast'

jest.mock('@/lib/api')
jest.mock('@/lib/auth')
jest.mock('react-hot-toast')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  it('completes full login and profile fetch flow', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    const mockLoginResponse = {
      data: {
        access_token: 'test-token',
        token_type: 'Bearer',
        user: mockUser,
      },
    }

    // Mock login
    ;(api.post as jest.Mock).mockResolvedValue(mockLoginResponse)
    ;(api.get as jest.Mock).mockResolvedValue({ data: mockUser })

    const wrapper = createWrapper()

    // Login
    const { result: loginResult } = renderHook(() => useLogin(), { wrapper })

    act(() => {
      loginResult.current.mutate({
        email: 'test@example.com',
        password: 'password',
      })
    })

    await waitFor(() => expect(loginResult.current.isSuccess).toBe(true))

    expect(auth.setToken).toHaveBeenCalledWith('test-token')
    expect(auth.setUser).toHaveBeenCalledWith(mockUser)

    // Fetch profile
    const { result: profileResult } = renderHook(() => useProfile(), { wrapper })

    await waitFor(() => expect(profileResult.current.isSuccess).toBe(true))

    expect(profileResult.current.data).toEqual(mockUser)
  })

  it('handles logout flow', async () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = { id: '1', email: 'test@example.com' }

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })
})
