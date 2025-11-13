import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from '@/hooks/useLogin'
import { api, handleApiError } from '@/lib/api'
import * as auth from '@/lib/auth'
import toast from 'react-hot-toast'

jest.mock('@/lib/api')
jest.mock('@/lib/auth')
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles successful login', async () => {
    const mockResponse = {
      data: {
        access_token: 'test-token',
        token_type: 'Bearer',
        user: { id: '1', email: 'test@example.com' },
      },
    }
    ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    result.current.mutate({ email: 'test@example.com', password: 'password' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(auth.setToken).toHaveBeenCalledWith('test-token')
    expect(auth.setUser).toHaveBeenCalledWith(mockResponse.data.user)
    expect(toast.success).toHaveBeenCalledWith('Login successful!')
  })

  it('handles login error', async () => {
    const mockError = new Error('Invalid credentials')
    ;(api.post as jest.Mock).mockRejectedValue(mockError)
    ;(handleApiError as jest.Mock).mockReturnValue({ message: 'Invalid credentials' })

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    result.current.mutate({ email: 'test@example.com', password: 'wrong' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
  })
})
