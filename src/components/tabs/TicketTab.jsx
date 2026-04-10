import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import styles from './TicketTab.module.css'

const TOTAL_TICKETS = 10

export default function TicketTab() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGuests()
  }, [])

  const loadGuests = async () => {
    try {
      const snap = await getDocs(collection(db, 'tickets'))
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error loading tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const allocated = guests.reduce((sum, g) => sum + (g.tickets || 0), 0)
  const remaining = TOTAL_TICKETS - allocated

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tickets</h2>
        <p className={styles.subtitle}>Paris has 10 tickets to allocate for the ceremony.</p>
      </div>

      <div className={'card ' + styles.summaryCard}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum}>{TOTAL_TICKETS}</span>
            <span className={styles.summaryLabel}>Total tickets</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum}>{allocated}</span>
            <span className={styles.summaryLabel}>Allocated</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum + (remaining === 0 ? ' ' + styles.numRed : ' ' + styles.numGreen)}>
              {remaining}
            </span>
            <span className={styles.summaryLabel}>Remaining</span>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(allocated / TOTAL_TICKETS) * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Guest Allocations</h3>
        {loading ? (
          <p className={styles.emptyMsg}>Loading...</p>
        ) : guests.length === 0 ? (
          <div className={'card ' + styles.emptyCard}>
            <p className={styles.emptyMsg}>Ticket allocations haven't been set up yet — check back soon!</p>
          </div>
        ) : (
          <div className={styles.guestList}>
            {guests.map(g => (
              <div key={g.id} className={'card ' + styles.guestRow}>
                <div className={styles.guestInfo}>
                  <span className={styles.guestName}>{g.name}</span>
                  {g.relationship && (
                    <span className={styles.guestRel}>{g.relationship}</span>
                  )}
                </div>
                <div className={styles.ticketBadge}>
                  🎟️ {g.tickets} ticket{g.tickets !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={'card ' + styles.note}>
        <p>💌 <strong>Deadline to confirm was April 20th.</strong> If you have questions about your ticket, reach out to Paris directly!</p>
      </div>
    </div>
  )
}
