import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProfile } from '@/hooks/useProfile'
import { api } from '@/lib/api'

jest.mock('@/lib/api')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches profile successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    ;(api.get as jest.Mock).mockResolvedValue({ data: mockUser })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockUser)
  })

  it('handles profile fetch error', async () => {
    ;(api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
