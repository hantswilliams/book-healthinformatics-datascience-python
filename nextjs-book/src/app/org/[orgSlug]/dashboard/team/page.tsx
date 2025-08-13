'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { Card, Badge } from '@/components/ui/Card';
import { useSupabase } from '@/lib/SupabaseProvider';

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
  const { user, userProfile, organization, loading: authLoading } = useSupabase();
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
    if (authLoading) return;
    
    if (!user || !userProfile || !organization) {
      router.push('/login');
      return;
    }

    // Check permissions
    if (!['OWNER', 'ADMIN'].includes(userProfile.role)) {
      router.push(`/org/${orgSlug}/dashboard`);
      return;
    }

    fetchTeamData();
  }, [user, userProfile, organization, authLoading, router, orgSlug]);

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

  const roleBadgeTone = (role: string): any => {
    switch (role) {
      case 'OWNER': return 'purple';
      case 'ADMIN': return 'indigo';
      case 'INSTRUCTOR': return 'info';
      case 'LEARNER': return 'neutral';
      default: return 'neutral';
    }
  };

  const difficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return <Badge tone="success">Beginner</Badge>;
      case 'INTERMEDIATE': return <Badge tone="info">Intermediate</Badge>;
      case 'ADVANCED': return <Badge tone="warning">Advanced</Badge>;
      case 'EXPERT': return <Badge tone="danger">Expert</Badge>;
      default: return <Badge tone="neutral">{difficulty}</Badge>;
    }
  };

  if (authLoading || isLoading) {
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
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between py-6">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <Link href={`/org/${orgSlug}/dashboard`} className="text-sm font-medium text-zinc-500 hover:text-indigo-600">
                      Admin
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 flex-shrink-0 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-sm font-medium text-zinc-600">Team</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Team Management</h1>
              <p className="mt-1 text-sm text-zinc-600">Manage team members and invitations</p>
            </div>
            <div className="flex items-center gap-4">
              {orgInfo && (
                <Badge tone="indigo" subtle className="font-medium">
                  {orgInfo.currentSeats} / {orgInfo.maxSeats} seats
                </Badge>
              )}
              {canInviteMore && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Invite Member
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <Card padding="sm" className="mb-8 border-rose-200 bg-rose-50 text-rose-700">
            <div className="text-sm">{error}</div>
          </Card>
        )}

        {!canInviteMore && orgInfo && (
          <Card padding="md" className="mb-8 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Seat limit reached</h3>
                <p className="mt-1 text-sm text-amber-800">You've reached your {orgInfo.subscriptionTier} plan limit of {orgInfo.maxSeats} seats. Upgrade to invite more members.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Team Members */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Team Members <span className="font-normal text-zinc-400">({teamMembers.length})</span></h3>
                {canInviteMore && (
                  <button onClick={() => setShowInviteModal(true)} className="hidden rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 md:inline-flex">Invite</button>
                )}
              </div>
              {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                  <h4 className="mt-4 text-sm font-medium text-zinc-900">No team members yet</h4>
                  <p className="mt-1 text-sm text-zinc-500">Invite your first team member to get started.</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Member</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Role</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Status</th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {teamMembers.map(member => (
                        <tr key={member.id} className="group hover:bg-zinc-50/50">
                          {/* Member Info */}
                          <td className="px-0 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
                                <span className="text-sm font-semibold">
                                  {(member.firstName?.[0] || member.email[0]).toUpperCase()}
                                  {member.lastName?.[0]?.toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-zinc-900">{member.firstName} {member.lastName}</p>
                                <p className="truncate text-xs text-zinc-500">{member.email}</p>
                                <p className="mt-1 text-[11px] text-zinc-400">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  {member.lastLoginAt && ` • Active ${new Date(member.lastLoginAt).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          {/* Role */}
                          <td className="px-3 py-4">
                            <Badge tone={roleBadgeTone(member.role)}>{member.role}</Badge>
                          </td>
                          
                          {/* Status */}
                          <td className="px-3 py-4">
                            {member.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                                Inactive
                              </span>
                            )}
                          </td>
                          
                          {/* Actions */}
                          <td className="px-3 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Courses Button */}
                              <button
                                onClick={() => openBookAccessModal(member.id)}
                                className="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                                title="Manage course access"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Courses
                              </button>
                              
                              {/* Deactivate Button - Only for owners on non-owner active members */}
                              {userProfile?.role === 'OWNER' && member.role !== 'OWNER' && member.isActive && (
                                <button
                                  onClick={() => handleDeactivateUser(member.id)}
                                  className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                  title="Deactivate member"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
          {/* Pending Invitations */}
          <div className="space-y-6">
            <Card padding="lg">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Pending Invitations <span className="font-normal text-zinc-400">({invitations.length})</span></h3>
              </div>
              {invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <svg className="h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <p className="mt-3 text-sm text-zinc-500">No pending invitations</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {invitations.map(invitation => (
                    <li key={invitation.id} className="rounded-lg border border-zinc-200 bg-white/60 p-4 backdrop-blur-sm">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className="truncate text-sm font-medium text-zinc-900" title={invitation.email}>{invitation.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge tone={roleBadgeTone(invitation.role)}>{invitation.role}</Badge>
                          <button
                            onClick={() => handleRemoveInvitation(invitation.id)}
                            className="text-[11px] font-medium text-rose-600 hover:text-rose-700"
                            title="Remove invitation"
                          >Remove</button>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500">Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}</p>
                      <p className="text-[11px] text-zinc-500">Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <Card className="relative w-full max-w-md" padding="lg">
            <h3 className="text-base font-semibold text-zinc-900">Invite Team Member</h3>
            <p className="mt-1 text-sm text-zinc-500">Send an invitation email to add a new member.</p>
            <form onSubmit={handleInvite} className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-zinc-600">Email</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-xs font-medium uppercase tracking-wide text-zinc-600">Role</label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="LEARNER">Learner</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  {userProfile?.role === 'OWNER' && <option value="ADMIN">Admin</option>}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                  disabled={inviteLoading}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >{inviteLoading ? 'Sending…' : 'Send Invitation'}</button>
              </div>
            </form>
          </Card>
        </div>
      )}

  {/* Course Access Modal (backend still refers to books) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeBookAccessModal} />
          <Card className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto" padding="lg">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Course Access</h3>
                <p className="mt-1 text-sm text-zinc-500">Manage which courses this member can access.</p>
              </div>
              <button onClick={closeBookAccessModal} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {accessLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-zinc-600">
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-indigo-600" /> Loading courses…
              </div>
            ) : memberBookAccess ? (
              <div className="space-y-6">
                {memberBookAccess.books.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <h4 className="mt-4 text-sm font-medium text-zinc-900">No courses available</h4>
                    <p className="mt-1 text-sm text-zinc-500">Create organization courses first to assign access.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {memberBookAccess.books.map(book => (
                      <div key={book.id} className={['rounded-lg border p-4 transition', book.hasAccess ? 'border-indigo-300 bg-indigo-50/50' : 'border-zinc-200 bg-white/70'].join(' ')}>
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-medium text-zinc-900">{book.title}</h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {difficultyBadge(book.difficulty)}
                              <Badge tone="neutral">{book.category.replace('_', ' ')}</Badge>
                              {book.estimatedHours && <Badge tone="indigo">{book.estimatedHours}h</Badge>}
                            </div>
                            {book.hasAccess && book.grantedAt && (
                              <p className="mt-2 text-[11px] text-zinc-500">Granted {new Date(book.grantedAt).toLocaleDateString()}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => toggleBookAccess(book.id, !book.hasAccess)}
                              className={[
                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                                book.hasAccess ? 'bg-indigo-600' : 'bg-zinc-200'
                              ].join(' ')}
                              role="switch"
                              aria-checked={book.hasAccess}
                            >
                              <span
                                className={[
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                  book.hasAccess ? 'translate-x-5' : 'translate-x-0'
                                ].join(' ')}
                              />
                            </button>
                            <span className="text-xs font-medium text-zinc-700">
                              {book.hasAccess ? (
                                <span className="text-indigo-700">Enabled</span>
                              ) : (
                                <span className="text-zinc-500">Disabled</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <div className="mt-8 flex justify-end">
              <button onClick={closeBookAccessModal} className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50">Close</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}