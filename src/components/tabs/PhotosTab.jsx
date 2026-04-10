import { useState, useEffect, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage'
import { storage } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import styles from './PhotosTab.module.css'

export default function PhotosTab() {
  const { guest } = useAuth()
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const listRef = ref(storage, 'photos/')
      const res = await listAll(listRef)
      const urls = await Promise.all(res.items.map(item => getDownloadURL(item)))
      setPhotos(urls.reverse())
    } catch (err) {
      console.error('Error loading photos:', err)
    }
  }

  const handleFiles = async (files) => {
    if (!files.length) return
    setUploading(true)
    setProgress(0)

    const file = files[0]
    const ext = file.name.split('.').pop()
    const fileName = `${guest.name.replace(/\s+/g, '_')}_${Date.now()}.${ext}`
    const storageRef = ref(storage, `photos/${fileName}`)

    const task = uploadBytesResumable(storageRef, file)
    task.on('state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err => { console.error(err); setUploading(false) },
      async () => {
        await loadPhotos()
        setUploading(false)
        setProgress(0)
      }
    )
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Photos</h2>
        <p className={styles.subtitle}>Share your photos from the big day!</p>
      </div>

      {/* Upload zone */}
      <div
        className={styles.dropzone}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className={styles.uploadProgress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressLabel}>Uploading... {progress}%</p>
          </div>
        ) : (
          <>
            <span className={styles.uploadIcon}>📸</span>
            <p className={styles.uploadText}>Click or drag a photo to upload</p>
            <p className={styles.uploadSub}>Share your favourite moments!</p>
          </>
        )}
      </div>

      {/* Gallery */}
      {photos.length > 0 ? (
        <div className={styles.gallery}>
          {photos.map((url, i) => (
            <div
              key={i}
              className={styles.photoTile}
              onClick={() => setLightbox(url)}
            >
              <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className={'card ' + styles.emptyCard}>
          <p>No photos yet — be the first to upload one! 🎓</p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" />
          <button className={styles.lightboxClose}>✕</button>
        </div>
      )}
    </div>
  )
}
