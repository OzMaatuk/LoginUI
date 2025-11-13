import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRequestOTP, useVerifyOTP } from '@/hooks/useOTP'
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

describe('useRequestOTP', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles successful OTP request', async () => {
    const mockResponse = { data: { message: 'OTP sent' } }
    ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRequestOTP(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ email: 'test@example.com' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('OTP sent')
  })
})

describe('useVerifyOTP', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles successful OTP verification', async () => {
    const mockResponse = {
      data: { message: 'Verified', access_token: 'test-token' },
    }
    ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useVerifyOTP(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ email: 'test@example.com', otp: '123456' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(auth.setToken).toHaveBeenCalledWith('test-token')
    expect(toast.success).toHaveBeenCalledWith('OTP verified successfully!')
  })
})
