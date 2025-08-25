import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from './hooks'
import { setUser, clearAuth, setLoading } from '../state/slices/slice'

export const useAuthCheck = () => {
  const [isLoading, setIsLoading] = useState(true)
  const dispatch = useAppDispatch()
  const authState = useAppSelector(state => state.auth)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch(setLoading(true))
        
        // Check for stored token
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          dispatch(clearAuth())
          return
        }

        // Validate token with server
        // This is a placeholder - you would make an API call here
        // For now, we'll just set a mock user if token exists
        const mockUser = {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        dispatch(setUser({ user: mockUser, token }))
      } catch (error) {
        console.error('Auth check failed:', error)
        dispatch(clearAuth())
      } finally {
        dispatch(setLoading(false))
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [dispatch])

  return {
    isLoading,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
  }
} 