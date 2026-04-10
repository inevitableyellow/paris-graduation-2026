import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('What should we call you?'); return }
    if (!password.trim()) { setError('Need the password!'); return }

    setLoading(true)
    setError('')
    const result = login(name.trim(), password.trim())
    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.circle1} />
        <div className={styles.circle2} />
        <div className={styles.circle3} />
      </div>

      <div className={styles.card + ' fade-up'}>
        <div className={styles.cap}>🎓</div>
        <h1 className={styles.title}>Paris's Graduation</h1>
        <p className={styles.subtitle}>April 30, 2026 · University of Michigan</p>

        <div className={styles.divider} />

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Your name</label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. Mom, Jake, Shae-Lynn..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="Ask Paris if you don't know!"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={'btn-gold ' + styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Entering...' : 'Enter the celebration ✨'}
          </button>
        </form>
      </div>
    </div>
  )
}
