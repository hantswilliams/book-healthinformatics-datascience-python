'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/lib/SupabaseProvider';

export default function AccountPage() {
  const { user, userProfile, organization, loading: authLoading, refreshUser } = useSupabase();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize form data when user profile loads
  React.useEffect(() => {
    if (userProfile && user) {
      setFormData({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        email: user.email || ''
      });
    }
  }, [userProfile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        // Refresh the user profile data
        await refreshUser();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to update profile');
      }
    } catch {
      setMessage('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile || !organization) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Please Sign In</h1>
        <p className="text-zinc-600 mb-6">You need to be signed in to access your account settings.</p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Account Settings</h1>
        <p className="text-zinc-600">Manage your profile information and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('successfully') 
            ? 'bg-green-50 border border-green-200 text-green-600' 
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setMessage('');
                  // Reset form data
                  setFormData({
                    firstName: userProfile.first_name || '',
                    lastName: userProfile.last_name || '',
                    email: user.email || ''
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-zinc-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">First Name</label>
                <p className="text-zinc-900">{userProfile.first_name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Last Name</label>
                <p className="text-zinc-900">{userProfile.last_name}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
              <p className="text-zinc-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
              <p className="text-zinc-900">{userProfile.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                userProfile.role === 'ADMIN' 
                  ? 'bg-red-100 text-red-800'
                  : userProfile.role === 'INSTRUCTOR'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {userProfile.role.charAt(0) + userProfile.role.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Account Actions</h2>
        <div className="space-y-3">
          <Link
            href="/progress"
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h3 className="font-medium text-zinc-900">View Progress</h3>
                <p className="text-sm text-zinc-600">Check your learning progress and achievements</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          
          <Link
            href="/resources"
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">📚</span>
              <div>
                <h3 className="font-medium text-zinc-900">Learning Resources</h3>
                <p className="text-sm text-zinc-600">Access additional learning materials and links</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}