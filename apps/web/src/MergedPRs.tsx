import { useEffect, useState } from 'react'

type PR = {
  number: number
  title: string
  body: string | null
  html_url: string
  merged_at: string | null
  user: { login: string }
}

export default function MergedPRs({ repo }: { repo: string }) {
  const [prs, setPrs] = useState<PR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub error ${res.status}`)
        return res.json()
      })
      .then((data: PR[]) => setPrs(data.filter((pr) => pr.merged_at !== null)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [repo])

  if (loading) return <p style={{ fontSize: 14 }}>Loading pull requests...</p>
  if (error) return <p style={{ color: 'tomato', fontSize: 14 }}>{error}</p>
  if (prs.length === 0) return <p style={{ fontSize: 14, opacity: 0.7 }}>No merged pull requests yet.</p>

  return (
    <ul style={{ fontSize: 14 }}>
      {prs.map((pr) => (
        <li key={pr.number}>
          <a href={pr.html_url} target="_blank" rel="noreferrer">
            #{pr.number} {pr.title}
          </a>{' '}
          <span style={{ opacity: 0.7 }}>
            by {pr.user.login}, merged {new Date(pr.merged_at!).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  )
}