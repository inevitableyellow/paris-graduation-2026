import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import styles from './RsvpTab.module.css'

export default function RsvpTab() {
  const { guest } = useAuth()
  const [attending, setAttending] = useState(null) // true | false | null
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rsvps, setRsvps] = useState([])
  const [loadingRsvps, setLoadingRsvps] = useState(true)
  const [alreadyRsvpd, setAlreadyRsvpd] = useState(false)

  useEffect(() => {
    loadRsvps()
  }, [])

  const loadRsvps = async () => {
    try {
      const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRsvps(data)

      // Check if this guest already RSVPd
      const mine = data.find(r => r.name.toLowerCase() === guest.name.toLowerCase())
      if (mine) {
        setAlreadyRsvpd(true)
        setAttending(mine.attending)
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Error loading RSVPs:', err)
    } finally {
      setLoadingRsvps(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (attending === null) return

    setLoading(true)
    try {
      await addDoc(collection(db, 'rsvps'), {
        name: guest.name,
        attending,
        message: message.trim(),
        createdAt: new Date(),
      })
      setSubmitted(true)
      loadRsvps()
    } catch (err) {
      console.error('Error submitting RSVP:', err)
    } finally {
      setLoading(false)
    }
  }

  const attendingCount = rsvps.filter(r => r.attending).length
  const notAttendingCount = rsvps.filter(r => !r.attending).length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>RSVP</h2>
        <p className={styles.subtitle}>Let Paris know if you'll be there to celebrate!</p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className={'card ' + styles.form}>
          <p className={styles.question}>Will you be attending?</p>
          <div className={styles.choices}>
            <button
              type="button"
              className={styles.choice + (attending === true ? ' ' + styles.choiceYes : '')}
              onClick={() => setAttending(true)}
            >
              <span className={styles.choiceEmoji}>🎉</span>
              <span>Yes, I'll be there!</span>
            </button>
            <button
              type="button"
              className={styles.choice + (attending === false ? ' ' + styles.choiceNo : '')}
              onClick={() => setAttending(false)}
            >
              <span className={styles.choiceEmoji}>😢</span>
              <span>Can't make it</span>
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Leave Paris a message (optional)</label>
            <textarea
              className={'input-field ' + styles.textarea}
              placeholder="Congrats, words of wisdom, anything!"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className={'btn-gold ' + styles.submitBtn}
            disabled={attending === null || loading}
          >
            {loading ? 'Submitting...' : 'Submit RSVP'}
          </button>
        </form>
      ) : (
        <div className={'card ' + styles.confirmation}>
          <span className={styles.confirmIcon}>{attending ? '🎉' : '💙'}</span>
          <h3 className={styles.confirmTitle}>
            {attending ? "You're confirmed!" : "Thanks for letting us know"}
          </h3>
          <p className={styles.confirmMsg}>
            {attending
              ? "Can't wait to celebrate with you on April 30th!"
              : "You'll be missed — maybe catch Paris for a celebration dinner after!"}
          </p>
        </div>
      )}

      {/* RSVP Summary */}
      {!loadingRsvps && rsvps.length > 0 && (
        <div className={styles.section}>
          <div className={styles.counts}>
            <div className={styles.countCard + ' card'}>
              <span className={styles.countNum}>{attendingCount}</span>
              <span className={styles.countLabel}>Attending 🎉</span>
            </div>
            <div className={styles.countCard + ' card'}>
              <span className={styles.countNum}>{notAttendingCount}</span>
              <span className={styles.countLabel}>Can't make it 💙</span>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Messages</h3>
          <div className={styles.messages}>
            {rsvps.filter(r => r.message).map(r => (
              <div key={r.id} className={'card ' + styles.messageCard}>
                <div className={styles.messageMeta}>
                  <span className={styles.messageName}>{r.name}</span>
                  <span className={styles.messageBadge + (r.attending ? ' ' + styles.badgeYes : ' ' + styles.badgeNo)}>
                    {r.attending ? 'Attending' : "Can't make it"}
                  </span>
                </div>
                <p className={styles.messageText}>{r.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
