/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type UserProfile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user profile when user changes
  const loadUserProfile = async (user: User | null) => {
    if (!user) {
      setUserProfile(null)
      return
    }

    try {
      // First check if user profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        setUserProfile(existingProfile)
      } else {
        // Create new profile with admin role for specific email
        const isAdmin = user.email?.toLowerCase() === 'jacobreesnew@gmail.com'
        const newProfile = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          role: isAdmin ? 'admin' : 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        try {
          const { data: createdProfile } = await supabase
            .from('user_profiles')
            .insert([newProfile])
            .select('*')
            .single()

          if (createdProfile) {
            setUserProfile(createdProfile)
          } else {
            // If database insert fails, use local profile
            setUserProfile(newProfile)
          }
        } catch (dbError) {
          // If table doesn't exist yet, use local profile
          console.log('Database not ready, using local profile')
          setUserProfile(newProfile)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Set a basic profile if database fails
      setUserProfile({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        role: user.email?.toLowerCase() === 'jacobreesnew@gmail.com' ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadUserProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadUserProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const isAdmin = userProfile?.role === 'admin'

  const value = {
    user,
    session,
    userProfile,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}