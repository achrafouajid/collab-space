import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  systemStatus: string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  user?: string;
}

const SimpleDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 4,
    activeUsers: 3,
    newUsersToday: 1,
    systemStatus: 'demo'
  })
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'user_registered',
      title: 'Demo Activity',
      description: 'This is demo data. Start the backend server to see real data.',
      time: new Date().toISOString(),
      user: 'Demo User'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Try to import and use the dashboard service
      const { dashboardService } = await import('../../services/dashboardService')
      
      const [statsData, activitiesData] = await Promise.all([
        dashboardService.getStatistics(),
        dashboardService.getRecentActivities(5)
      ])
      
      setStats(statsData)
      setActivities(activitiesData)
      setIsBackendConnected(true)
      setError('')
    } catch (error: any) {
      console.warn('Backend not available, using demo data:', error)
      setIsBackendConnected(false)
      setError('Backend server not running - showing demo data')
      
      // Keep the demo data that's already set
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Try to logout via auth service if available
      const { authService } = await import('../../services/authService')
      await authService.logout()
    } catch (error) {
      console.warn('Auth service not available, doing local logout')
      // Clear local storage anyway
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('isAuthenticated')
    } finally {
      window.location.href = '/login'
    }
  }

  if (loading && isBackendConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              {!isBackendConnected && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Demo Mode
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/demo/users"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Manage Users
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Backend Status Message */}
          {!isBackendConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Demo Mode:</strong> Backend server not running. Start the backend with <code className="bg-yellow-100 px-1 rounded">npm run dev:simple</code> to see real data.
                  </p>
                  <button 
                    onClick={fetchDashboardData}
                    className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
                  >
                    Try to connect to backend
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600">
                {isBackendConnected 
                  ? "Here's what's happening in your application today."
                  : "This is demo data. Start the backend server to see real statistics."
                }
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total Users */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-50 p-3 rounded-md">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-green-50 p-3 rounded-md">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* New Users Today */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">New Today</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stats.newUsersToday}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stats.systemStatus === 'online' ? 'bg-green-50' : stats.systemStatus === 'demo' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                      <svg className={`w-6 h-6 ${stats.systemStatus === 'online' ? 'text-green-600' : stats.systemStatus === 'demo' ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">System Status</dt>
                      <dd className={`text-2xl font-semibold ${stats.systemStatus === 'online' ? 'text-green-600' : stats.systemStatus === 'demo' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stats.systemStatus || 'Unknown'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  to="/demo/users"
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                    <p className="mt-2 text-sm text-gray-500">Create new users and view all existing users</p>
                  </div>
                </Link>

                <button 
                  onClick={fetchDashboardData}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {isBackendConnected ? 'Refresh Data' : 'Connect to Backend'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {isBackendConnected 
                        ? 'Update dashboard with latest information'
                        : 'Try to connect to the backend server'
                      }
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {activities.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activities.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== activities.length - 1 ? (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="bg-green-500 rounded-full p-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900">{activity.title}</span>
                                </div>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  {new Date(activity.time).toLocaleDateString()} at {new Date(activity.time).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="mt-2 text-sm text-gray-700">
                                <p>{activity.description}</p>
                                {activity.user && (
                                  <p className="mt-1 text-xs text-gray-500">by {activity.user}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default SimpleDashboard 