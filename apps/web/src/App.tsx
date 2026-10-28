import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Projects from './Projects'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if someone is already logged in
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Update the page whenever login or logout happens
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <h1>Shipnote</h1>

      {session ? (
        <>
          <p>Signed in as <strong>{session.user.user_metadata.user_name}</strong></p>
          <img
            src={session.user.user_metadata.avatar_url}
            alt="avatar"
            width={64}
            style={{ borderRadius: '50%' }}
          />
          <br />
          <button onClick={signOut}>Sign out</button>   <Projects session={session} />
        </>
      ) : (
        <button onClick={signInWithGitHub}>Sign in with GitHub</button>
      )}
    </main>
  )
}