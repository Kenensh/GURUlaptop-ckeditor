import { useEffect, useState, useRef } from 'react'
import styles from '@/styles/BackToTop.module.css'

const isClient = typeof window !== 'undefined'

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)
  const mainBodyRef = useRef(null)

  useEffect(() => {
    if (!isClient) return

    // 只在組件初始化時查詢一次 DOM
    mainBodyRef.current = document.querySelector('.main-body')

    const handleScroll = () => {
      if (!mainBodyRef.current) return

      const scrollTop = mainBodyRef.current.scrollTop || 0
      setIsVisible(scrollTop > 300)
    }

    if (mainBodyRef.current) {
      mainBodyRef.current.addEventListener('scroll', handleScroll)
      return () => {
        if (mainBodyRef.current) {
          mainBodyRef.current.removeEventListener('scroll', handleScroll)
        }
      }
    }
  }, [])

  const scrollToTop = () => {
    if (!isClient || !mainBodyRef.current) return

    mainBodyRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isClient) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className={`${styles.backToTop} ${isVisible ? styles.show : ''}`}
      aria-label="回到頂部"
    >
      ↑
    </button>
  )
}

export default BackToTop
