'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  resource_type: 'link' | 'document' | 'video' | 'tool';
  category: 'learning' | 'reference' | 'tools' | 'documentation' | 'external';
  icon?: string;
  order_index: number;
  is_active: boolean;
}

// Default fallback resources if organization has no custom resources
const defaultResources = [
  {
    id: 'default-1',
    title: "Python.org Official Tutorial",
    description: "The official Python tutorial from Python.org",
    url: "https://docs.python.org/3/tutorial/",
    resource_type: 'link' as const,
    category: 'learning' as const,
    icon: '🐍',
    order_index: 1,
    is_active: true
  },
  {
    id: 'default-2',
    title: "Pandas Documentation",
    description: "Complete guide to data manipulation with Pandas",
    url: "https://pandas.pydata.org/docs/",
    resource_type: 'document' as const,
    category: 'reference' as const,
    icon: '🐼',
    order_index: 2,
    is_active: true
  },
  {
    id: 'default-3',
    title: "Jupyter Notebook Documentation",
    description: "Learn how to use Jupyter notebooks effectively",
    url: "https://jupyter-notebook.readthedocs.io/",
    resource_type: 'tool' as const,
    category: 'tools' as const,
    icon: '📓',
    order_index: 3,
    is_active: true
  },
  {
    id: 'default-4',
    title: "NumPy Documentation",
    description: "Comprehensive guide to numerical computing with Python",
    url: "https://numpy.org/doc/stable/",
    resource_type: 'document' as const,
    category: 'reference' as const,
    icon: '🔢',
    order_index: 4,
    is_active: true
  },
  {
    id: 'default-5',
    title: "Real Python Tutorials",
    description: "High-quality Python tutorials and guides",
    url: "https://realpython.com/",
    resource_type: 'link' as const,
    category: 'learning' as const,
    icon: '🎓',
    order_index: 5,
    is_active: true
  }
];

const resourceTypeInfo = {
  link: { icon: '🔗', color: 'bg-blue-100 text-blue-800' },
  document: { icon: '📄', color: 'bg-green-100 text-green-800' },
  video: { icon: '🎥', color: 'bg-red-100 text-red-800' },
  tool: { icon: '🛠️', color: 'bg-purple-100 text-purple-800' }
};

const categoryInfo = {
  learning: { icon: '📚', color: 'bg-indigo-100 text-indigo-800', title: 'Learning Resources' },
  reference: { icon: '📖', color: 'bg-yellow-100 text-yellow-800', title: 'Reference Documentation' },
  tools: { icon: '🔧', color: 'bg-gray-100 text-gray-800', title: 'Development Tools' },
  documentation: { icon: '📋', color: 'bg-orange-100 text-orange-800', title: 'Documentation' },
  external: { icon: '🌐', color: 'bg-cyan-100 text-cyan-800', title: 'External Resources' }
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingDefaults, setIsUsingDefaults] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations/resources?active=true');

      if (response.ok) {
        const result = await response.json();
        const orgResources = result.data || [];

        if (orgResources.length > 0) {
          setResources(orgResources);
          setIsUsingDefaults(false);
        } else {
          // Use default resources if organization has no custom resources
          setResources(defaultResources);
          setIsUsingDefaults(true);
        }
      } else {
        // Fallback to default resources if API call fails
        setResources(defaultResources);
        setIsUsingDefaults(true);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to default resources
      setResources(defaultResources);
      setIsUsingDefaults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Group resources by category
  const resourcesByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Learning Resources</h1>
        <p className="text-xl text-gray-600">
          {isUsingDefaults
            ? "Helpful links and resources to enhance your Python programming journey"
            : "Custom resources curated for your organization"}
        </p>
        {/* {isUsingDefaults && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Your organization administrators can customize these resources in the settings panel.
            </p>
          </div>
        )} */}
      </div>

      {/* Resources by Category */}
      {Object.entries(resourcesByCategory).map(([category, categoryResources]) => {
        const categoryData = categoryInfo[category as keyof typeof categoryInfo];

        return (
          <div key={category} className="mb-12">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">{categoryData.icon}</span>
              <h2 className="text-2xl font-bold text-gray-900">{categoryData.title}</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryResources.map((resource) => {
                const typeInfo = resourceTypeInfo[resource.resource_type];

                return (
                  <div key={resource.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex space-x-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${typeInfo.color}`}>
                          {typeInfo.icon} {resource.resource_type}
                        </span>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${categoryData.color}`}>
                          {categoryData.icon} {category}
                        </span>
                      </div>
                      {resource.icon && (
                        <span className="text-2xl">{resource.icon}</span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {resource.title}
                    </h3>

                    {resource.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {resource.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        Visit Resource
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      <span className="text-xs text-gray-500">
                        {new URL(resource.url).hostname}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Practice?</h2>
        <p className="text-lg mb-6">
          Apply what you&apos;ve learned with our interactive exercises and courses
        </p>
        <Link
          href="../"
          className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          Start Learning
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

      {/* Resources Count Footer */}
      <div className="text-center mt-8 text-sm text-gray-500">
        Showing {resources.length} resource{resources.length !== 1 ? 's' : ''}
        {isUsingDefaults && ' (default collection)'}
      </div>
    </div>
  );
}