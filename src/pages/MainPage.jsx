import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InfoTab from '../components/tabs/InfoTab'
import RsvpTab from '../components/tabs/RsvpTab'
import TicketTab from '../components/tabs/TicketTab'
import PhotosTab from '../components/tabs/PhotosTab'
import styles from './MainPage.module.css'

const TABS = [
  { id: 'info',   label: 'Info',    icon: '✨' },
  { id: 'rsvp',   label: 'RSVP',    icon: '📋' },
  { id: 'ticket', label: 'Ticket',  icon: '🎟️' },
  { id: 'photos', label: 'Photos',  icon: '📸' },
]

export default function MainPage() {
  const { guest, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'info':   return <InfoTab />
      case 'rsvp':   return <RsvpTab />
      case 'ticket': return <TicketTab />
      case 'photos': return <PhotosTab />
      default:       return <InfoTab />
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <span className={styles.logo}>🎓</span>
            <div>
              <h1 className={styles.siteName}>Paris's Graduation</h1>
              <p className={styles.welcomeMsg}>Welcome, {guest?.name}!</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            {guest?.isAdmin && (
              <button
                className={'btn-outline ' + styles.adminBtn}
                onClick={() => navigate('/admin')}
              >
                Admin
              </button>
            )}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className={styles.nav}>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={styles.tab + (activeTab === tab.id ? ' ' + styles.tabActive : '')}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className={styles.main}>
        <div key={activeTab} className={'fade-up ' + styles.tabContent}>
          {renderTab()}
        </div>
      </main>
    </div>
  )
}
