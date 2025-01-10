import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './EventManagement.module.css'
import axios from 'axios'
import Swal from 'sweetalert2'

// 創建 axios 實例
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const EventManagement = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // 統一的錯誤提示函數
  const showError = async (error) => {
    const message =
      error.response?.data?.message ||
      (error.response ? '請求失敗' : '無法連接到伺服器')
    await Swal.fire({
      icon: 'error',
      title: '錯誤',
      text: message,
      timer: 1500,
      showConfirmButton: false,
    })
  }

  // 獲取用戶活動
  const fetchUserEvents = async () => {
    try {
      setLoading(true)
      console.log('開始請求活動數據')
      const response = await axiosInstance.get('/api/events/user/registered')
      console.log('收到回應:', response.data)

      if (response.data?.code === 200) {
        setEvents(response.data.data?.events || [])
      }
    } catch (error) {
      console.error('完整錯誤信息:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      await showError(error)
    } finally {
      setLoading(false)
    }
  }

  // 取消報名
  const handleCancelRegistration = async (eventId) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: '確認取消報名',
      text: '您確定要取消報名此活動嗎？',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
    })

    if (!isConfirmed) return

    try {
      const { data } = await axiosInstance.delete(
        `/api/events/${eventId}/registration`
      )
      if (data?.code === 200) {
        await Swal.fire({
          icon: 'success',
          title: '取消成功',
          timer: 1500,
          showConfirmButton: false,
        })
        await fetchUserEvents()
      }
    } catch (error) {
      console.error('取消報名失敗:', error)
      await showError(error)
    }
  }

  // 圖片 URL 處理
  const getImageUrl = (imagePath) =>
    !imagePath?.trim()
      ? '/images/event-default.png'
      : imagePath.startsWith('http')
      ? imagePath
      : `${axiosInstance.defaults.baseURL}${imagePath}`

  // 日期格式化
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  useEffect(() => {
    fetchUserEvents()
  }, [])

  return (
    <div className={`py-2`}>
      <div className={styles.groupList}>
        <div className={styles.listHeader}>
          <div className={styles.listTitle}>
            <i className="bi bi-calendar-check"></i>
            我的活動
          </div>
        </div>

        <div
          className={`${styles.listRow} ${styles.desktopHeader} d-none d-md-block`}
        >
          <div className="row align-items-center">
            <div className="col-2"></div>
            <div className="col-3">活動名稱</div>
            <div className="col-2">活動時間</div>
            <div className="col-2">人數</div>
            <div className="col-2">狀態</div>
            <div className="col-1">操作</div>
          </div>
        </div>

        {events.map((event) => (
          <div key={event.id} className={styles.listRow}>
            {/* 桌面版視圖 */}
            <div className="row align-items-center d-none d-md-flex">
              <div className="col-2">
                <Link href={`/event/eventDetail/${event.id}`}>
                  <img
                    src={getImageUrl(event.picture)}
                    alt={event.name}
                    className={styles.groupImg}
                    onError={(e) => {
                      e.target.src = '/images/event-default.png'
                    }}
                  />
                </Link>
              </div>
              <div className="col-3">
                <Link
                  href={`/event/eventDetail/${event.id}`}
                  className={styles.eventLink}
                >
                  {event.name}
                </Link>
              </div>
              <div className="col-2">{formatDate(event.eventStartTime)}</div>
              <div className="col-2">
                {event.currentParticipants}/{event.maxPeople}
              </div>
              <div className="col-2">{event.status}</div>
              <div className="col-1">
                {event.status !== '已結束' && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleCancelRegistration(event.id)}
                    title="取消報名"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>
            </div>

            {/* 手機版視圖 */}
            <div className={`${styles.mobileLayout} d-block d-md-none`}>
              <div className={styles.mobileImgWrapper}>
                <Link href={`/event/eventDetail/${event.id}`}>
                  <img
                    src={getImageUrl(event.picture)}
                    alt={event.name}
                    className={styles.groupImg}
                    onError={(e) => {
                      e.target.src = '/images/event-default.png'
                    }}
                  />
                </Link>
              </div>
              <div className={styles.mobileInfo}>
                <div className={styles.mobileTitle}>
                  <Link
                    href={`/event/eventDetail/${event.id}`}
                    className={styles.eventLink}
                  >
                    {event.name}
                  </Link>
                </div>
                <div className={styles.mobileDetails}>
                  <div className={styles.mobileStats}>
                    <span>
                      <i className="bi bi-clock"></i>
                      {formatDate(event.eventStartTime)}
                    </span>
                    <span>
                      <i className="bi bi-people"></i>
                      {event.currentParticipants}/{event.maxPeople}
                    </span>
                    <span>
                      <i className="bi bi-flag"></i>
                      {event.status}
                    </span>
                  </div>
                  {event.status !== '已結束' && (
                    <div className={styles.mobileActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleCancelRegistration(event.id)}
                        title="取消報名"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventManagement
