'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LogoMark from '@/components/LogoMark';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { useSupabase } from '@/lib/SupabaseProvider';

const getIndustryIcon = (industry: string) => {
  const icons: { [key: string]: string } = {
    HEALTHCARE: '🏥',
    FINANCE: '💰',
    TECHNOLOGY: '💻',
    EDUCATION: '🎓',
    MANUFACTURING: '🏭',
    GOVERNMENT: '🏛️',
    NON_PROFIT: '🤝',
    GENERAL: '🏢',
  };
  return icons[industry] || '🏢';
};

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [orgInfo, setOrgInfo] = useState<{name: string; industry: string} | null>(null);
  const [userRole, setUserRole] = useState<{
    found: boolean;
    role?: string;
    authMethods?: {
      passwordLogin: boolean;
      codeLogin: boolean;
    }
  } | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = useOrgSlug();
  const { signIn, signInWithMagicLink } = useSupabase();

  useEffect(() => {
    // Force white background on body and html for login page
    document.body.classList.add('login-page-body');
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'rgb(24 24 27)';
    document.documentElement.style.backgroundColor = 'white';
    
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');
    
    if (messageParam) {
      setMessage(messageParam);
    }
    
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }

    // Fetch organization info
    const fetchOrgInfo = async () => {
      if (orgSlug) {
        try {
          const response = await fetch(`/api/organizations/public/${orgSlug}`);
          if (response.ok) {
            const data = await response.json();
            setOrgInfo(data);
          }
        } catch (error) {
          console.error('Failed to fetch org info:', error);
        }
      }
    };

    fetchOrgInfo();
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('login-page-body');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, [searchParams, orgSlug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const checkUserRole = async (email: string) => {
    if (!email || !orgSlug) return;

    setCheckingRole(true);
    setError('');
    setUserRole(null);

    try {
      const response = await fetch('/api/auth/check-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          orgSlug
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setUserRole({ found: false });
          setError(data.message || 'No account found with this email address in this organization');
        } else {
          setError(data.error || 'Failed to check user account');
        }
      } else {
        setUserRole(data);
        setError('');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setError('An error occurred while checking your account');
    } finally {
      setCheckingRole(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        setError('Invalid email or password');
      } else {
        // Successful login - redirect to dashboard
        router.push(`/org/${orgSlug}/dashboard`);
        router.refresh();
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    // Check user role first if we haven't already
    if (!userRole) {
      await checkUserRole(formData.email);
      return; // Let the user see the result and click again
    }

    if (!userRole.found) {
      setError('No account found with this email address in this organization');
      return;
    }

    setError('');
    setCodeLoading(true);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          orgSlug: orgSlug
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
      } else {
        setCodeSent(true);
        setMessage(`Verification code sent to ${formData.email}! Check your email and enter the 6-digit code below.`);
      }
    } catch {
      setError('An error occurred while sending the verification code');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setError('');
    setVerifyLoading(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
          orgSlug: orgSlug
        })
      });

      const data = await response.json();
      console.log('🔍 Verify response:', { response: response.ok, data });

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
      } else {
        console.log('✅ Verification successful, redirecting to:', data.redirectUrl);
        // Successful verification - redirect to the provided URL
        if (data.redirectUrl) {
          console.log('🔄 Using data.redirectUrl:', data.redirectUrl);
          // Try multiple redirect methods for better compatibility
          try {
            window.location.replace(data.redirectUrl);
          } catch (e) {
            console.log('window.location.replace failed, trying href');
            window.location.href = data.redirectUrl;
          }
        } else {
          console.log('🔄 Using fallback redirect');
          router.push(`/org/${orgSlug}/dashboard`);
        }
      }
    } catch (error) {
      console.error('❌ Frontend verification error:', error);
      setError('An error occurred while verifying the code');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen bg-white" style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <LogoMark className="h-7 w-7 text-zinc-900 transition-transform group-hover:scale-105" variant="brackets" />
              <span className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">Interactive Coding</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          {orgInfo ? (
            <>
              <h1 className="text-sm text-zinc-600">Welcome back to</h1>
              <h2 className="mt-1 text-2xl font-bold text-indigo-600">{orgInfo.name}</h2>
              <p className="mt-2 text-zinc-600">Sign in to continue your training</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-zinc-900">Sign in</h1>
              <p className="mt-2 text-zinc-600">Access your interactive training platform</p>
            </>
          )}
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {codeSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 mb-3">
                Verification code sent! Check your email and enter the 6-digit code below.
              </p>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={formData.verificationCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData(prev => ({ ...prev, verificationCode: value }));
                }}
                placeholder="123456"
                maxLength={6}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-2xl font-mono tracking-widest text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifyLoading || formData.verificationCode.length !== 6}
                className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              
              <div className="flex justify-between items-center text-sm">
                <button
                  onClick={() => {
                    setCodeSent(false);
                    setMessage('');
                    setFormData({ email: '', password: '', verificationCode: '' });
                  }}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Try different email
                </button>
                
                <button
                  onClick={handleSendCode}
                  disabled={codeLoading}
                  className="text-zinc-600 hover:text-zinc-500"
                >
                  {codeLoading ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <h3 className="text-sm font-medium text-zinc-700 mb-3">Enter your email to continue</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  name="email"
                  placeholder="your.email@example.com"
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                
                {/* Show role check button if email is entered but role not checked */}
                {formData.email && !userRole && (
                  <button
                    type="button"
                    onClick={() => checkUserRole(formData.email)}
                    disabled={checkingRole}
                    className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingRole ? 'Checking Account...' : 'Continue'}
                  </button>
                )}
              </div>
            </div>

            {/* Show authentication methods based on user role */}
            {userRole?.found && (
              <>
                {/* Verification Code Login - Available for all users */}
                {userRole.authMethods?.codeLogin && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700 mb-3">
                      Sign In with Verification Code
                    </h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={codeLoading}
                        className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {codeLoading ? 'Sending Code...' : 'Send 6-Digit Code'}
                      </button>
                      <p className="text-xs text-zinc-500 text-center">
                        We&apos;ll send a verification code to your email
                      </p>
                    </div>
                  </div>
                )}

                {/* Password Login - Only for non-learners */}
                {userRole.authMethods?.passwordLogin && (
                  <>
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-zinc-500">Or use your password</span>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                      <div>
                        <input
                          type="password"
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Signing in…' : 'Sign in with Password'}
                      </button>
                    </form>
                  </>
                )}

                {/* Show user's role for clarity */}
                <div className="text-center">
                  <p className="text-xs text-zinc-500">
                    Signing in as: <span className="font-medium">{userRole.role?.toLowerCase()}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}