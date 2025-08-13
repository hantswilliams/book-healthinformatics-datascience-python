'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase-client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Database } from './supabase';

type SupabaseUser = Database['public']['Tables']['users']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface SupabaseContextType {
  user: User | null;
  userProfile: SupabaseUser | null;
  organization: Organization | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: {
    username: string;
    firstName?: string;
    lastName: string;
    organizationId: string;
    role?: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  }) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<SupabaseUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      console.log('Profile query result - data:', profile, 'error:', error);

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Try to fetch without organization join to debug
        const { data: basicProfile, error: basicError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        console.log('Basic profile query - data:', basicProfile, 'error:', basicError);
        return;
      }

      if (profile) {
        console.log('Setting user profile:', profile);
        console.log('Setting organization:', profile.organization);
        setUserProfile(profile);
        setOrganization(profile.organization as Organization);
      } else {
        console.log('No user profile found for user ID:', userId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const refreshUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await fetchUserProfile(currentUser.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Sign in result:', result);
    if (result.data?.user && !result.error) {
      console.log('Sign in successful, fetching user profile...');
      await fetchUserProfile(result.data.user.id);
    }
    
    setLoading(false);
    return { error: result.error };
  };

  const signUp = async (email: string, password: string, userData: {
    username: string;
    firstName?: string;
    lastName: string;
    organizationId: string;
    role?: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  }) => {
    setLoading(true);
    
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_id: userData.organizationId,
          role: userData.role || 'LEARNER',
        }
      }
    });

    if (authError) {
      setLoading(false);
      return { error: authError };
    }

    // Then create the user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username: userData.username,
          first_name: userData.firstName || null,
          last_name: userData.lastName,
          organization_id: userData.organizationId,
          role: userData.role || 'LEARNER',
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Note: We might want to delete the auth user here if profile creation fails
      }
    }

    setLoading(false);
    return { error: authError };
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    const defaultRedirectTo = redirectTo || `${window.location.origin}/auth/callback`;
    const result = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: defaultRedirectTo
      }
    });
    
    return { error: result.error };
  };

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setOrganization(null);
    setSession(null);
    return { error: result.error };
  };

  useEffect(() => {
    // Get initial session with improved error handling
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
      }
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error during session initialization:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          setUserProfile(null);
          setOrganization(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: SupabaseContextType = {
    user,
    userProfile,
    organization,
    session,
    loading,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}