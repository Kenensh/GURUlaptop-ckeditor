import { useEffect, useState, useRef } from 'react'
import styles from '@/styles/BackToTop.module.css'

const isClient = typeof window !== 'undefined'

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const mainBodyRef = useRef(null)
  const scrollObserver = useRef(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isClient || !isMounted) return

    try {
      // 使用 requestAnimationFrame 來優化性能
      let ticking = false
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const mainBody = document.querySelector('.main-body')
            if (!mainBody) {
              console.warn('[BackToTop] Main body element not found')
              return
            }

            const scrollTop = mainBody.scrollTop || 0
            setIsVisible(scrollTop > 300)
            ticking = false
          })
          ticking = true
        }
      }

      // 找到主要的滾動容器
      mainBodyRef.current = document.querySelector('.main-body')
      if (mainBodyRef.current) {
        mainBodyRef.current.addEventListener('scroll', handleScroll, { passive: true })
        
        // 初始檢查
        handleScroll()
      } else {
        console.warn('[BackToTop] Main body element not found on mount')
      }

      return () => {
        if (mainBodyRef.current) {
          mainBodyRef.current.removeEventListener('scroll', handleScroll)
        }
      }
    } catch (error) {
      console.error('[BackToTop] Error setting up scroll listener:', error)
    }
  }, [isMounted])

  const scrollToTop = () => {
    if (!isClient) return

    try {
      const mainBody = document.querySelector('.main-body')
      if (!mainBody) {
        console.warn('[BackToTop] Main body element not found on scroll')
        return
      }

      mainBody.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } catch (error) {
      console.error('[BackToTop] Error scrolling to top:', error)
      // 降級方案
      if (mainBodyRef.current) {
        mainBodyRef.current.scrollTop = 0
      }
    }
  }

  // 在 SSR 時或未掛載時不渲染
  if (!isClient || !isMounted) return null

  return (
    <button
      onClick={scrollToTop}
      className={`${styles.backToTop} ${isVisible ? styles.show : ''}`}
      aria-label="回到頂部"
      type="button"
    >
      ↑
    </button>
  )
}

export default BackToTop