import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { clearLocalUserData } from '../utils/storage'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    const h = new URLSearchParams(window.location.hash.slice(1))
    return p.get('error_description') || h.get('error_description') || null
  })

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearLocalUserData()
        setUser(null)
        window.location.reload()
        return
      }
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

  return { user, loading, authError, sendMagicLink, signInWithGoogle, signOut }
}
