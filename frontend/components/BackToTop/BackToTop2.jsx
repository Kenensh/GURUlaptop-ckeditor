import { useEffect, useState, useCallback } from 'react'
import styles from '@/styles/BackToTop.module.css'

const isClient = typeof window !== 'undefined'

const BackToTop2 = () => {
  const [isVisible, setIsVisible] = useState(false)

  // 使用 useCallback 記憶化滾動處理函數
  const handleScroll = useCallback(() => {
    try {
      // 使用 requestAnimationFrame 優化性能
      window.requestAnimationFrame(() => {
        const scrollPosition = window?.pageYOffset ?? window?.scrollY ?? 0
        setIsVisible(scrollPosition > 300)
      })
    } catch (error) {
      console.error('[BackToTop2] Error handling scroll:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    try {
      // 初始檢查滾動位置
      handleScroll()

      // 添加滾動監聽器，使用 passive 提升性能
      window.addEventListener('scroll', handleScroll, { passive: true })

      // 清理函數
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    } catch (error) {
      console.error('[BackToTop2] Error setting up scroll listener:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }, [handleScroll])

  const scrollToTop = () => {
    if (!isClient) return

    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      console.error('[BackToTop2] Error scrolling to top:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })
      // 降級方案
      window.scrollTo(0, 0)
    }
  }

  // 在 SSR 時不渲染
  if (!isClient) return null

  return (
    <button
      onClick={scrollToTop}
      className={`${styles.backToTop} ${isVisible ? styles.show : ''}`}
      type="button"
      aria-label="回到頂部"
    >
      ↑
    </button>
  )
}

export default BackToTop2
