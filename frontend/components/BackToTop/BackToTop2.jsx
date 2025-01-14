import { useEffect, useState } from 'react'
import styles from '@/styles/BackToTop.module.css'

const isClient = typeof window !== 'undefined'

const BackToTop2 = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      const scrollPosition = window?.scrollY || 0
      setIsVisible(scrollPosition > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    if (!isClient) return

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // 在 SSR 時不渲染
  if (!isClient) return null

  return (
    <button
      onClick={scrollToTop}
      className={`${styles.backToTop} ${isVisible ? styles.show : ''}`}
    >
      ↑
    </button>
  )
}

export default BackToTop2
