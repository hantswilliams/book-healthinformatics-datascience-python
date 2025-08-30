'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { useSupabase } from '@/lib/SupabaseProvider';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo?: string;
  website?: string;
  industry: string;
  subscriptionTier: string;
  maxSeats: number;
  currentSeats: number;
  createdAt: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export default function OrganizationSettings() {
  const { user, userProfile, organization: supabaseOrg, loading: authLoading } = useSupabase();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: 'GENERAL'
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !userProfile || !supabaseOrg) {
      router.push('/login');
      return;
    }

    // Check permissions - Only owners and admins can access organization settings
    if (!['OWNER', 'ADMIN'].includes(userProfile.role)) {
      router.push(`/org/${orgSlug}/dashboard`);
      return;
    }

    fetchOrganizationData();
  }, [user, userProfile, supabaseOrg, authLoading, router, orgSlug]);

  const fetchOrganizationData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/subscription/status');
      if (!response.ok) {
        throw new Error('Failed to load organization data');
      }

      const result = await response.json();
      const orgData = result.data.organization;
      
      setOrganization(orgData);
      setFormData({
        name: orgData.name || '',
        description: orgData.description || '',
        website: orgData.website || '',
        industry: orgData.industry || 'GENERAL'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/organizations/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update organization');
      }

      setOrganization({ ...organization!, ...formData });
      setIsEditing(false);
      setSuccess('Organization settings updated successfully!');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: organization?.name || '',
      description: organization?.description || '',
      website: organization?.website || '',
      industry: organization?.industry || 'GENERAL'
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleResetOrganization = () => {
    setShowResetConfirm(true);
    setResetConfirmText('');
    setError('');
    setSuccess('');
  };

  const confirmResetOrganization = async () => {
    if (resetConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm the reset action');
      return;
    }

    try {
      setIsResetting(true);
      setError('');
      
      const response = await fetch('/api/organizations/reset', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset organization');
      }

      setSuccess('Organization has been reset successfully. All books and chapters have been deleted.');
      setShowResetConfirm(false);
      setResetConfirmText('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset organization');
    } finally {
      setIsResetting(false);
    }
  };

  const cancelResetOrganization = () => {
    setShowResetConfirm(false);
    setResetConfirmText('');
    setError('');
  };

  const industryOptions = [
    { value: 'GENERAL', label: 'General' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'MANUFACTURING', label: 'Manufacturing' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'NON_PROFIT', label: 'Non-Profit' }
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Unable to load organization settings</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <Link href={`/org/${orgSlug}/dashboard`} className="text-gray-500 hover:text-zinc-700">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-gray-500">Settings</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Organization Settings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your organization's information and preferences
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit Settings
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 text-zinc-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Your organization name"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Brief description of your organization"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-zinc-700">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">
                      Industry
                    </label>
                    <select
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {industryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Organization Stats & Info */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Organization Stats</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Plan</span>
                    <span className="text-sm text-gray-900">{organization.subscriptionTier}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Seats Used</span>
                    <span className="text-sm text-gray-900">{organization.currentSeats} / {organization.maxSeats}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(organization.currentSeats / organization.maxSeats) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Created</span>
                    <span className="text-sm text-gray-900">
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Organization ID</h3>
              </div>
              <div className="px-6 py-4">
                <div className="bg-gray-50 rounded-md p-3">
                  <code className="text-sm text-gray-800 break-all">{organization.id}</code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use this ID for API integrations and support requests
                </p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href={`/org/${orgSlug}/dashboard/team`}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    Manage Team
                  </Link>
                  <Link
                    href={`/org/${orgSlug}/dashboard/billing`}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Billing Settings
                  </Link>
                  <Link
                    href={`/org/${orgSlug}/dashboard/content`}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Manage Content
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dangerous Actions Section - Only show for OWNER */}
        {userProfile?.role === 'OWNER' && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg border-l-4 border-red-500">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900">Danger Zone</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  These actions cannot be undone. Please proceed with caution.
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-red-800">Reset Organization</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete all books, chapters, and learning content associated with this organization. 
                        This action cannot be undone and will remove all content created by your organization.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={handleResetOrganization}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Reset Organization Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Reset Organization</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  This will permanently delete <strong>ALL books and chapters</strong> associated with your organization: 
                  <span className="font-semibold text-gray-900"> "{organization?.name}"</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. All learning content will be lost forever.
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE here"
                  />
                </div>
                {error && (
                  <div className="mt-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={cancelResetOrganization}
                    className="px-4 py-2 bg-gray-300 text-zinc-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResetOrganization}
                    disabled={isResetting || resetConfirmText !== 'DELETE'}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResetting ? 'Resetting...' : 'Reset Organization'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}