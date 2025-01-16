// components/dashboard/LoadingSpinner.js
import React from 'react'
import { PacmanLoader } from 'react-spinners'
import dynamic from 'next/dynamic'

const isClient = typeof window !== 'undefined'

// 動態導入 PacmanLoader
const DynamicPacmanLoader = dynamic(
  () => import('react-spinners').then((mod) => mod.PacmanLoader),
  { ssr: false }
)

export const LoadingSpinner = ({ show = false }) => {
  // 開發時的日誌
  if (process.env.NODE_ENV === 'development') {
    console.log('LoadingSpinner rendered', { show })
  }

  // SSR 檢查
  if (!isClient) return null

  // 不顯示時返回 null
  if (!show) return null

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-black bg-opacity-25"
      style={{ zIndex: 9999 }}
    >
      <DynamicPacmanLoader
        color="#d8d8d8"
        size={100}
        aria-label="Loading Spinner"
      />
    </div>
  )
}

// 使用 dynamic 避免 SSR 問題
export default dynamic(() => Promise.resolve(LoadingSpinner), { ssr: false })
