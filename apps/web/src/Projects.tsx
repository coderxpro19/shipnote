import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type Repo = { id: number; name: string; full_name: string; description: string | null; fork: boolean }
type Project = { id: string; name: string; github_repo: string }

export default function Projects({ session }: { session: Session }) {
  const username = session.user.user_metadata.user_name as string
  const userId = session.user.id

  const [repos, setRepos] = useState<Repo[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadProjects() {
    // .eq('owner_id', ...) matters: public projects are readable by everyone,
    // so without it we'd also see other people's projects.
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, github_repo')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setProjects(data)
  }

  useEffect(() => {
    loadProjects()

    fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=100`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub error ${res.status}`)
        return res.json()
      })
      .then((data: Repo[]) => setRepos(data.filter((r) => !r.fork)))
      .catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  async function addProject(repo: Repo) {
    setError(null)
    const { error } = await supabase.from('projects').insert({
      owner_id: userId,
      name: repo.name,
      slug: `${username}-${repo.name}`.toLowerCase(),
      github_repo: repo.full_name,
    })
    if (error) setError(error.message)
    else loadProjects()
  }

  const added = new Set(projects.map((p) => p.github_repo))

  return (
    <section style={{ marginTop: 32 }}>
      {error && <p style={{ color: 'tomato' }}>{error}</p>}

      <h2>Your Shipnote projects</h2>
      {projects.length === 0 ? (
        <p>None yet. Add one below.</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id}>{p.github_repo}</li>
          ))}
        </ul>
      )}

      <h2>Your public repos</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {repos.map((repo) => (
          <li key={repo.id} style={{ marginBottom: 12 }}>
            <strong>{repo.name}</strong>{' '}
            <button onClick={() => addProject(repo)} disabled={added.has(repo.full_name)}>
              {added.has(repo.full_name) ? 'Added' : 'Add'}
            </button>
            <div style={{ fontSize: 14, opacity: 0.7 }}>{repo.description}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}