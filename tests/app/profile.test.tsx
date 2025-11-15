import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import ProfilePage from '@/app/profile/page'

jest.mock('next-auth/react')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })
    
    render(<ProfilePage />)
    
    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders user profile when authenticated', () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      },
    }
    
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
    
    render(<ProfilePage />)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
      },
    }
    
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
    
    render(<ProfilePage />)
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    })
  })
})
