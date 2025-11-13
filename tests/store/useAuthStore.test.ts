import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/store/useAuthStore'
import { User } from '@/lib/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
      result.current.setLoading(false)
    })
  })

  it('initializes with null user and not loading', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('sets user correctly', () => {
    const { result } = renderHook(() => useAuthStore())
    const user: User = { id: '1', email: 'test@example.com' }

    act(() => {
      result.current.setUser(user)
    })

    expect(result.current.user).toEqual(user)
  })

  it('sets loading state correctly', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('clears user on logout', () => {
    const { result } = renderHook(() => useAuthStore())
    const user: User = { id: '1', email: 'test@example.com' }

    act(() => {
      result.current.setUser(user)
    })

    expect(result.current.user).toEqual(user)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })
})
