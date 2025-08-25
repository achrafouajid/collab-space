import React from 'react'

interface ChartPlaceholderProps {
  title: string
  subtitle?: string
  height?: string
  type?: 'line' | 'bar' | 'pie' | 'area'
  data?: any[] // Placeholder for future chart data
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({
  title,
  subtitle,
  height = 'h-64',
  type = 'line'
}) => {
  const getChartIcon = () => {
    switch (type) {
      case 'bar':
        return (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
          </svg>
        )
      case 'pie':
        return (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        )
      case 'area':
        return (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        )
      default: // line
        return (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
          </svg>
        )
    }
  }

  const getChartPattern = () => {
    switch (type) {
      case 'bar':
        return (
          <div className="flex items-end justify-center space-x-2 h-32">
            {[40, 60, 80, 45, 70, 55, 90].map((height, index) => (
              <div
                key={index}
                className="bg-blue-200 rounded-t"
                style={{ height: `${height}%`, width: '12px' }}
              />
            ))}
          </div>
        )
      case 'pie':
        return (
          <div className="flex items-center justify-center h-32">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-blue-200 rounded-full" />
              <div className="absolute inset-0 bg-green-200 rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }} />
              <div className="absolute inset-0 bg-yellow-200 rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 50% 100%)' }} />
            </div>
          </div>
        )
      case 'area':
        return (
          <div className="relative h-32 flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 200 100">
              <path
                d="M0,80 Q50,20 100,40 T200,30 L200,100 L0,100 Z"
                fill="rgba(59, 130, 246, 0.3)"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
              />
            </svg>
          </div>
        )
      default: // line
        return (
          <div className="relative h-32 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 200 100">
              <path
                d="M10,80 Q50,20 100,40 T190,30"
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {[10, 50, 100, 150, 190].map((x, index) => (
                <circle key={index} cx={x} cy={index === 0 ? 80 : index === 1 ? 20 : index === 2 ? 40 : index === 3 ? 60 : 30} r="4" fill="rgb(59, 130, 246)" />
              ))}
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            {getChartIcon()}
          </div>
        </div>
        
        <div className={`${height} flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg`}>
          <div className="text-center">
            {getChartPattern()}
            <p className="mt-4 text-sm text-gray-500">
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart Placeholder
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Replace with actual chart library (Chart.js, Recharts, etc.)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartPlaceholder 