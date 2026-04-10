import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const { guest } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('rsvps')

  // RSVPs
  const [rsvps, setRsvps] = useState([])

  // Tickets
  const [tickets, setTickets] = useState([])
  const [newName, setNewName] = useState('')
  const [newRel, setNewRel] = useState('')
  const [newCount, setNewCount] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRsvps()
    loadTickets()
  }, [])

  const loadRsvps = async () => {
    const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const loadTickets = async () => {
    const snap = await getDocs(collection(db, 'tickets'))
    setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const addTicket = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'tickets'), {
      name: newName.trim(),
      relationship: newRel.trim(),
      tickets: Number(newCount),
    })
    setNewName(''); setNewRel(''); setNewCount(1)
    await loadTickets()
    setSaving(false)
  }

  const deleteTicket = async (id) => {
    await deleteDoc(doc(db, 'tickets', id))
    await loadTickets()
  }

  const deleteRsvp = async (id) => {
    await deleteDoc(doc(db, 'rsvps', id))
    await loadRsvps()
  }

  const totalAllocated = tickets.reduce((s, t) => s + (t.tickets || 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/home')}>← Back</button>
        <h1 className={styles.title}>Admin Panel</h1>
        <p className={styles.sub}>Hello, {guest?.name} 👋</p>
      </div>

      <div className={styles.tabs}>
        {['rsvps', 'tickets'].map(t => (
          <button
            key={t}
            className={styles.tabBtn + (tab === t ? ' ' + styles.tabActive : '')}
            onClick={() => setTab(t)}
          >
            {t === 'rsvps' ? '📋 RSVPs' : '🎟️ Tickets'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {tab === 'rsvps' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>RSVPs ({rsvps.length})</h2>
              <span className={styles.chip}>{rsvps.filter(r=>r.attending).length} attending</span>
            </div>
            {rsvps.length === 0 ? (
              <p className={styles.empty}>No RSVPs yet.</p>
            ) : (
              <div className={styles.list}>
                {rsvps.map(r => (
                  <div key={r.id} className={'card ' + styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowName}>{r.name}</span>
                      <span className={styles.badge + (r.attending ? ' ' + styles.badgeGreen : ' ' + styles.badgeRed)}>
                        {r.attending ? 'Attending' : "Can't make it"}
                      </span>
                    </div>
                    {r.message && <p className={styles.rowMsg}>"{r.message}"</p>}
                    <button className={styles.deleteBtn} onClick={() => deleteRsvp(r.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'tickets' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Ticket Allocations</h2>
              <span className={styles.chip}>{totalAllocated} / 10 allocated</span>
            </div>

            <form onSubmit={addTicket} className={'card ' + styles.addForm}>
              <h3 className={styles.formTitle}>Add guest</h3>
              <div className={styles.formRow}>
                <input className="input-field" placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} required />
                <input className="input-field" placeholder="Relationship (e.g. Mom)" value={newRel} onChange={e=>setNewRel(e.target.value)} />
                <input className={'input-field ' + styles.numInput} type="number" min="1" max="10" value={newCount} onChange={e=>setNewCount(e.target.value)} />
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? '...' : 'Add'}
                </button>
              </div>
            </form>

            {tickets.length === 0 ? (
              <p className={styles.empty}>No tickets allocated yet.</p>
            ) : (
              <div className={styles.list}>
                {tickets.map(t => (
                  <div key={t.id} className={'card ' + styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowName}>{t.name}</span>
                      {t.relationship && <span className={styles.rowRel}>{t.relationship}</span>}
                      <span className={styles.ticketCount}>🎟️ {t.tickets}</span>
                    </div>
                    <button className={styles.deleteBtn} onClick={() => deleteTicket(t.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
