import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const sendMagicLink = (email) => supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: process.env.REACT_APP_SUPABASE_REDIRECT_URL || window.location.origin,
    },
  })

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: process.env.REACT_APP_SUPABASE_REDIRECT_URL || window.location.origin,
    },
  })

  const signOut = () => supabase.auth.signOut()

  return { user, loading, sendMagicLink, signInWithGoogle, signOut }
}
