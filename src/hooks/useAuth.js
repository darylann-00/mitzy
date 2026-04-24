import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION after any OAuth code exchange finishes,
    // so it's the right place to resolve both user and loading. getSession() can race
    // against the PKCE exchange and flash the login gate before auth completes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const sendMagicLink = (email) => supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin,
    },
  })

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin,
    },
  })

  const signOut = () => supabase.auth.signOut()

  return { user, loading, sendMagicLink, signInWithGoogle, signOut }
}
