// glowing-text.js
import React, { useEffect, useState } from 'react'
import styles from './glowing-text.module.scss'

const GlowingText = ({ text, className }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 如果在伺服器端，返回基本版本
  if (!isClient) {
    return <h1 className={className}>{text}</h1>
  }

  return (
    <div className={`${styles.glowing_txt} ${className}`}>
      <h1>
        {text.split(/(\s+)/).map((segment, segmentIndex) => {
          // 處理空格
          if (/\s+/.test(segment)) {
            return (
              <span key={`space-${segmentIndex}`} className={styles.space}>
                &nbsp;
              </span>
            )
          }

          // 處理文字
          return segment.split('').map((letter, letterIndex) => (
            <span 
              key={`${segmentIndex}-${letterIndex}`}
              className={styles.letter}
            >
              {letter}
            </span>
          ))
        })}
      </h1>
    </div>
  )
}

export default GlowingText