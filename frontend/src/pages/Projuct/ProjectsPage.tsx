import React from 'react'
import { DashboardLayout } from '../../components/dashboard'

const ProjectsPage: React.FC = () => {
  const sampleProjects = [
    {
      id: 1,
      name: 'E-commerce Website',
      description: 'Modern e-commerce platform with React and Node.js',
      status: 'In Progress',
      progress: 75,
      team: ['JD', 'SM', 'MJ'],
      dueDate: '2024-02-15'
    },
    {
      id: 2,
      name: 'Mobile App',
      description: 'Cross-platform mobile application using React Native',
      status: 'Planning',
      progress: 25,
      team: ['AB', 'CD'],
      dueDate: '2024-03-01'
    },
    {
      id: 3,
      name: 'Analytics Dashboard',
      description: 'Data visualization dashboard for business metrics',
      status: 'Completed',
      progress: 100,
      team: ['EF', 'GH', 'IJ', 'KL'],
      dueDate: '2024-01-30'
    },
    {
      id: 4,
      name: 'API Integration',
      description: 'RESTful API integration with third-party services',
      status: 'In Progress',
      progress: 60,
      team: ['MN', 'OP'],
      dueDate: '2024-02-20'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Projects
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all your active projects in one place.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Filter
            </button>
            <button
              type="button"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {project.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{project.description}</p>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900 font-medium">{project.progress}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Team and Due Date */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-500 text-white text-xs font-medium ring-2 ring-white"
                      >
                        {member}
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 text-gray-600 text-xs font-medium ring-2 ring-white">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Due {new Date(project.dueDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 bg-indigo-600 text-white text-sm py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    View Details
                  </button>
                  <button className="flex-1 bg-white text-gray-700 text-sm py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Project Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200">
          <div className="p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Create new project</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProjectsPage 