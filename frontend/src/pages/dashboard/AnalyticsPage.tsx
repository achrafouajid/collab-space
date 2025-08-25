import React from 'react'
import { DashboardLayout, ChartPlaceholder, StatCard } from '../components/dashboard'

const AnalyticsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed analytics and performance metrics for your projects.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Page Views"
            value="54,231"
            subtitle="This month"
            trend={{ value: 18, isPositive: true }}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <StatCard
            title="Bounce Rate"
            value="32.4%"
            subtitle="This month"
            trend={{ value: 5, isPositive: false }}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <StatCard
            title="Conversion Rate"
            value="4.8%"
            subtitle="This month"
            trend={{ value: 12, isPositive: true }}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartPlaceholder
            title="Traffic Sources"
            subtitle="Where your visitors come from"
            type="pie"
            height="h-80"
          />
          <ChartPlaceholder
            title="User Engagement"
            subtitle="Daily active users and session duration"
            type="area"
            height="h-80"
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ChartPlaceholder
            title="Performance Metrics"
            subtitle="Page load times and user interactions over time"
            type="line"
            height="h-64"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AnalyticsPage 