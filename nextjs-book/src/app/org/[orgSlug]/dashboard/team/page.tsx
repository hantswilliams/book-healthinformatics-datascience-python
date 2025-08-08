'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';

interface TeamMember {
  id: string;
  firstName?: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt?: string;
  invitedBy?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    firstName?: string;
    lastName: string;
  };
}

interface OrganizationInfo {
  currentSeats: number;
  maxSeats: number;
  subscriptionTier: string;
}

interface Book {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  estimatedHours?: number;
  hasAccess: boolean;
  accessType?: 'READ' | 'write' | 'admin';
  expiresAt?: string;
  grantedAt?: string;
}

interface UserBookAccess {
  user: {
    id: string;
    firstName?: string;
    lastName: string;
    email: string;
    role: string;
  };
  books: Book[];
}

export default function TeamManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'LEARNER' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberBookAccess, setMemberBookAccess] = useState<UserBookAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Check permissions
    if (!['OWNER', 'ADMIN'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchTeamData();
  }, [session, status, router]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch team members, invitations, and org info in parallel
      const [membersResponse, invitationsResponse, statusResponse] = await Promise.all([
        fetch('/api/organizations/members'),
        fetch('/api/invitations/pending'),
        fetch('/api/subscription/status')
      ]);

      if (!membersResponse.ok || !invitationsResponse.ok || !statusResponse.ok) {
        throw new Error('Failed to load team data');
      }

      const [membersResult, invitationsResult, statusResult] = await Promise.all([
        membersResponse.json(),
        invitationsResponse.json(),
        statusResponse.json()
      ]);

      setTeamMembers(membersResult.data || []);
      setInvitations(invitationsResult.data || []);
      setOrgInfo({
        currentSeats: statusResult.data.organization.currentSeats,
        maxSeats: statusResult.data.organization.maxSeats,
        subscriptionTier: statusResult.data.organization.subscriptionTier
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      // Reset form and close modal
      setInviteForm({ email: '', role: 'LEARNER' });
      setShowInviteModal(false);
      
      // Refresh team data
      fetchTeamData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await fetch(`/api/organizations/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to deactivate user');
      }

      fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to remove this invitation?')) return;

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to remove invitation');
      }

      fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove invitation');
    }
  };

  const fetchMemberBookAccess = async (userId: string) => {
    try {
      setAccessLoading(true);
      const response = await fetch(`/api/organizations/members/${userId}/book-access`);
      
      if (!response.ok) {
        throw new Error('Failed to load book access');
      }
      
      const result = await response.json();
      setMemberBookAccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book access');
    } finally {
      setAccessLoading(false);
    }
  };

  const toggleBookAccess = async (bookId: string, hasAccess: boolean) => {
    if (!selectedMember) return;
    
    try {
      const response = await fetch(`/api/organizations/members/${selectedMember}/book-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          hasAccess,
          accessType: 'READ'
        }),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update book access');
      }
      
      // Refresh the book access data
      fetchMemberBookAccess(selectedMember);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book access');
    }
  };

  const openBookAccessModal = (memberId: string) => {
    setSelectedMember(memberId);
    fetchMemberBookAccess(memberId);
  };

  const closeBookAccessModal = () => {
    setSelectedMember(null);
    setMemberBookAccess(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-red-100 text-red-800';
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'INSTRUCTOR': return 'bg-blue-100 text-blue-800';
      case 'LEARNER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-orange-100 text-orange-800';
      case 'EXPERT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  const canInviteMore = orgInfo && orgInfo.currentSeats + invitations.length < orgInfo.maxSeats;

  return (
    <div className="min-h-screen bg-gray-50">
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
                      <span className="ml-1 text-gray-500">Team</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your team members and invitations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {orgInfo && (
                <span className="text-sm text-gray-500">
                  {orgInfo.currentSeats} / {orgInfo.maxSeats} seats used
                </span>
              )}
              {canInviteMore && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Invite Member
                </button>
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

        {!canInviteMore && orgInfo && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Seat Limit Reached</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You've reached your {orgInfo.subscriptionTier} plan limit of {orgInfo.maxSeats} seats. 
                  Upgrade your plan to invite more members.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Team Members ({teamMembers.length})
                </h3>
                
                {teamMembers.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by inviting your first team member.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-zinc-700">
                                {member.firstName?.[0] || member.email[0].toUpperCase()}
                                {member.lastName[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                            <p className="text-xs text-gray-400">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                              {member.lastLoginAt && ` • Last active ${new Date(member.lastLoginAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                          
                          {!member.isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                          
                          <button
                            onClick={() => openBookAccessModal(member.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Manage Books
                          </button>
                          
                          {session?.user.role === 'OWNER' && member.role !== 'OWNER' && member.isActive && (
                            <button
                              onClick={() => handleDeactivateUser(member.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Invitations */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Pending Invitations ({invitations.length})
                </h3>
                
                {invitations.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No pending invitations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {invitation.email}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(invitation.role)}`}>
                              {invitation.role}
                            </span>
                            <button
                              onClick={() => handleRemoveInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="Remove invitation"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LEARNER">Learner</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  {session?.user.role === 'OWNER' && (
                    <option value="ADMIN">Admin</option>
                  )}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-gray-50"
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Access Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Book Access for {memberBookAccess?.user.firstName} {memberBookAccess?.user.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  Manage which books this team member can access
                </p>
              </div>
              <button
                onClick={closeBookAccessModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {accessLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading books...</span>
              </div>
            ) : memberBookAccess ? (
              <div className="space-y-4">
                {memberBookAccess.books.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No books available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create some organization books first to assign access.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberBookAccess.books.map((book) => (
                      <div key={book.id} className={`border rounded-lg p-4 ${
                        book.hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {book.title}
                            </h4>
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                getDifficultyColor(book.difficulty)
                              }`}>
                                {book.difficulty}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {book.category.replace('_', ' ')}
                              </span>
                              {book.estimatedHours && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {book.estimatedHours}h
                                </span>
                              )}
                            </div>
                            {book.hasAccess && book.grantedAt && (
                              <p className="text-xs text-gray-500">
                                Access granted {new Date(book.grantedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={book.hasAccess}
                                onChange={(e) => toggleBookAccess(book.id, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-zinc-700">
                                {book.hasAccess ? 'Has Access' : 'No Access'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeBookAccessModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}