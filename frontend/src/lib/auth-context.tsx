'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  alpaca_api_key?: string;
  alpaca_secret_key?: string;
  preferences?: {
    theme?: string;
    notifications?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      // Use .limit(1) instead of .single() to handle missing profiles gracefully
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (profileError) {
        console.error('Error fetching user profile:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        });
        return;
      }

      const profile = data && data.length > 0 ? data[0] : null;

      if (profile) {
        setUserProfile(profile);
      } else {
        // Profile doesn't exist, try to create it automatically
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && currentUser.id === userId) {
          const newProfile: UserProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          };

          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert(newProfile);

          if (insertError) {
            console.error('Error creating missing user profile:', insertError);
          } else {
            setUserProfile(newProfile);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    // Guard: only run on client side with valid Supabase config
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          }
        }
      });

      if (signupError) throw signupError;

      if (data.user) {
        const profile: Partial<UserProfile> = {
          id: data.user.id,
          email: data.user.email || '',
          display_name: displayName || email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profile);

        if (profileError) {
          console.error('Error creating user profile during signup:', profileError);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      setUser(data.user);
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;

      setUser(null);
      setUserProfile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reset password failed';
      setError(errorMessage);
      throw err;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    setError(null);
    try {
      if (!user) throw new Error('No user logged in');

      const updatedData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...updatedData
        });

      if (updateError) throw updateError;

      setUserProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update profile failed';
      setError(errorMessage);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
