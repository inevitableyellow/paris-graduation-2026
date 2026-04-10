import styles from './InfoTab.module.css'

const details = [
  { icon: '📅', label: 'Date', value: 'Wednesday, April 30, 2026' },
  { icon: '⏰', label: 'Time', value: '12:00 PM – 2:00 PM' },
  { icon: '📍', label: 'Venue', value: 'University of Michigan\nAnn Arbor, MI' },
  { icon: '🎟️', label: 'Tickets', value: '10 tickets allocated — check the Ticket tab' },
]

const schedule = [
  { time: '11:15 AM', event: 'Arrive & find your seats — it fills up fast!' },
  { time: '12:00 PM', event: 'Ceremony begins' },
  { time: '~2:00 PM', event: 'Ceremony ends, photos & celebration!' },
]

export default function InfoTab() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <p className={styles.heroEyebrow}>We did it 🎉</p>
        <h2 className={styles.heroTitle}>Celebrating Paris's<br />Master of Science</h2>
        <p className={styles.heroSub}>School of Information · University of Michigan</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Ceremony Details</h3>
        <div className={styles.detailsGrid}>
          {details.map((d, i) => (
            <div key={i} className={'card ' + styles.detailCard}>
              <span className={styles.detailIcon}>{d.icon}</span>
              <div>
                <p className={styles.detailLabel}>{d.label}</p>
                <p className={styles.detailValue}>{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Day-of Schedule</h3>
        <div className={styles.timeline}>
          {schedule.map((item, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineTime}>{item.time}</div>
              <div className={styles.timelineEvent}>{item.event}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Good to Know</h3>
        <div className={'card ' + styles.tipsCard}>
          {[
            '🅿️ Parking can be tight — plan to arrive early or use the campus shuttles',
            '📸 Photography is encouraged during the ceremony',
            '🌦️ April in Michigan — bring a layer just in case!',
            '💐 Feel free to bring flowers or a small gift to celebrate after',
          ].map((tip, i) => (
            <p key={i} className={styles.tip}>{tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
