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
  courseCount: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'LEARNER' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberBookAccess, setMemberBookAccess] = useState<UserBookAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    added: number;
    skipped: number;
    errors: string[];
  } | null>(null);

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
      
      // Fetch team members and org info in parallel
      const [membersResponse, statusResponse] = await Promise.all([
        fetch('/api/organizations/members'),
        fetch('/api/subscription/status')
      ]);

      if (!membersResponse.ok || !statusResponse.ok) {
        throw new Error('Failed to load team data');
      }

      const [membersResult, statusResult] = await Promise.all([
        membersResponse.json(),
        statusResponse.json()
      ]);

      setTeamMembers(membersResult.data || []);
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

  // Filter team members based on search term
  const filteredTeamMembers = teamMembers.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.firstName?.toLowerCase().includes(searchLower) ||
      member.lastName?.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.username.toLowerCase().includes(searchLower) ||
      member.role.toLowerCase().includes(searchLower)
    );
  });

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
    // Refresh team data to update course counts
    fetchTeamData();
  };

  const handleCSVUpload = async (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setBulkImportLoading(true);
    setError('');
    setImportResults(null);

    try {
      // Read file content
      const text = await file.text();
      
      // Parse CSV - split by lines and get first column of each row
      const lines = text.split('\n').filter(line => line.trim());
      const emails = lines
        .map(line => {
          // Get first column (split by comma and take first part)
          const firstColumn = line.split(',')[0].trim();
          // Remove quotes if present
          return firstColumn.replace(/^["']|["']$/g, '');
        })
        .filter(email => {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return email && emailRegex.test(email);
        });

      if (emails.length === 0) {
        setError('No valid email addresses found in the CSV file');
        return;
      }

      console.log(`📁 Parsed ${emails.length} emails from CSV:`, emails.slice(0, 5));

      // Send to API
      const response = await fetch('/api/organizations/bulk-import-learners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import learners');
      }

      setImportResults(result.results);
      setShowCsvUploadModal(false);
      setShowBulkImportModal(true);
      
      // Refresh team data to show new members
      fetchTeamData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setBulkImportLoading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCSVUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVUpload(e.dataTransfer.files[0]);
    }
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

  const canInviteMore = orgInfo && orgInfo.currentSeats < orgInfo.maxSeats;

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-zinc-800/50">
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

        <div className="max-w-7xl mx-auto">
          {/* Team Members */}
          <Card padding="lg">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                  Team Members <span className="font-normal text-zinc-400">({filteredTeamMembers.length} of {teamMembers.length})</span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 rounded-md border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <svg className="h-4 w-4 text-zinc-400 hover:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canInviteMore && (
                    <>
                      {/* CSV Upload Button */}
                      <button
                        onClick={() => setShowCsvUploadModal(true)}
                        disabled={bulkImportLoading}
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import CSV
                      </button>
                      
                      <button onClick={() => setShowInviteModal(true)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">Invite Member</button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {filteredTeamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                  <h4 className="mt-4 text-sm font-medium text-zinc-900">No team members yet</h4>
                  <p className="mt-1 text-sm text-zinc-500">Invite your first team member to get started.</p>
                </div>
              ) : searchTerm && filteredTeamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h4 className="mt-4 text-sm font-medium text-zinc-900">No members found</h4>
                  <p className="mt-1 text-sm text-zinc-500">Try adjusting your search terms.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Member</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Role</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Courses</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Status</th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredTeamMembers.map(member => (
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
                          
                          {/* Courses */}
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-900">{member.courseCount}</span>
                              {member.courseCount > 0 ? (
                                <Badge tone="indigo" subtle>
                                  {member.courseCount === 1 ? 'course' : 'courses'}
                                </Badge>
                              ) : (
                                <Badge tone="neutral" subtle>
                                  no access
                                </Badge>
                              )}
                            </div>
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

      {/* CSV Upload Modal */}
      {showCsvUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowCsvUploadModal(false)} />
          <Card className="relative w-full max-w-2xl" padding="lg">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Import Learners from CSV</h3>
                <p className="mt-1 text-sm text-zinc-500">Upload a CSV file to bulk import learners to your organization</p>
              </div>
              <button 
                onClick={() => setShowCsvUploadModal(false)} 
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>First column:</strong> Email addresses (one per row)</li>
                <li>• <strong>No headers required:</strong> Start directly with email addresses</li>
                <li>• <strong>Additional columns:</strong> Will be ignored</li>
                <li>• <strong>Duplicates:</strong> Already existing emails will be skipped</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                <p className="text-xs font-medium text-blue-900 mb-1">Example CSV content:</p>
                <pre className="text-xs text-blue-800 font-mono">
john@company.com
jane@company.com
bob@company.com</pre>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-zinc-300 hover:border-zinc-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                disabled={bulkImportLoading}
                className="sr-only"
              />
              
              {bulkImportLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600 mb-4"></div>
                  <p className="text-sm font-medium text-zinc-900">Processing CSV...</p>
                  <p className="text-xs text-zinc-500 mt-1">This may take a moment</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <svg 
                    className={`h-12 w-12 mb-4 ${dragActive ? 'text-indigo-500' : 'text-zinc-400'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  
                  <p className="text-sm font-medium text-zinc-900 mb-1">
                    {dragActive ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
                  </p>
                  <p className="text-xs text-zinc-500 mb-4">or</p>
                  
                  <label 
                    htmlFor="csv-upload" 
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Choose CSV File
                  </label>
                  
                  <p className="text-xs text-zinc-500 mt-3">Maximum file size: 10MB</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCsvUploadModal(false)}
                disabled={bulkImportLoading}
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* CSV Import Results Modal */}
      {showBulkImportModal && importResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowBulkImportModal(false)} />
          <Card className="relative w-full max-w-lg" padding="lg">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Import Complete</h3>
                <p className="mt-1 text-sm text-zinc-500">CSV import results summary</p>
              </div>
              <button 
                onClick={() => setShowBulkImportModal(false)} 
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <div className="text-2xl font-semibold text-green-900">{importResults.added}</div>
                  <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Added</div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
                  <div className="text-2xl font-semibold text-amber-900">{importResults.skipped}</div>
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">Skipped</div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                  <div className="text-2xl font-semibold text-blue-900">{importResults.total}</div>
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total</div>
                </div>
              </div>

              {/* Success Message */}
              {importResults.added > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Successfully Added Learners</h4>
                      <p className="mt-1 text-sm text-green-800">
                        {importResults.added} new learner{importResults.added === 1 ? '' : 's'} have been added to your organization. 
                        They will receive welcome emails with login instructions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skipped Info */}
              {importResults.skipped > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-900">Skipped Emails</h4>
                      <p className="mt-1 text-sm text-amber-800">
                        {importResults.skipped} email{importResults.skipped === 1 ? '' : 's'} were skipped because they already exist in your organization.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Info */}
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Errors</h4>
                      <div className="mt-1 text-sm text-red-800">
                        {importResults.errors.map((error, index) => (
                          <p key={index} className="mb-1 last:mb-0">{error}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {importResults.added > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <h4 className="text-sm font-medium text-blue-900">Next Steps</h4>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• New learners can sign in using verification codes</li>
                    <li>• Assign course access using the "Courses" button for each member</li>
                    <li>• Monitor progress from the Progress dashboard</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowBulkImportModal(false)} 
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}