import { useState, useRef, useEffect } from 'react'
import {
  popupCenter,
  subscribe,
  unsubscribe,
  publish,
} from '@/utils/popup-window'
import { useRouter } from 'next/router'
import useInterval from '@/hooks/use-interval'
import useLocalStorage from './use-localstorage'

// 統一的 isClient 檢查
const isClient = typeof window !== 'undefined'

const initialStore = {
  storeid: '',
  storename: '',
  storeaddress: '',
  outside: '',
  ship: '',
  TempVar: '',
}

export function useShip711StoreOpener(
  serverCallbackUrl = '',
  {
    title = '7-11運送店家選擇視窗',
    h = 680,
    w = 950,
    autoCloseMins = 5,
    enableLocalStorage = true,
    keyLocalStorage = 'store711',
  } = {}
) {
  // 基本狀態管理
  const [storedValue, setValue] = useLocalStorage(keyLocalStorage, initialStore)
  const newWindow = useRef(null)
  const [store711, setStore711] = useState(initialStore)
  const [startCountDown, setStartCountDown] = useState(false)
  const [countDown, setCountDown] = useState(60 * autoCloseMins)

  // 初始化時從 localStorage 讀取數據
  useEffect(() => {
    if (!isClient || !enableLocalStorage) return
    if (storedValue?.storeid) {
      setStore711(storedValue)
    }
  }, [enableLocalStorage, storedValue])

  // 事件訂閱管理
  useEffect(() => {
    if (!isClient) return

    const handlers = {
      'stop-countdown': () => setStartCountDown(false),
      'set-store': (e) => setStore711(e.detail),
      cancel: () => {
        setStartCountDown(false)
        setCountDown(60 * autoCloseMins)
        console.warn('錯誤:001-因為跳出視窗關閉無法取值')
      },
    }

    // 註冊所有事件處理器
    Object.entries(handlers).forEach(([event, handler]) => {
      subscribe(event, handler)
    })

    // 清理所有事件處理器
    return () => {
      Object.keys(handlers).forEach((event) => {
        unsubscribe(event)
      })
    }
  }, [autoCloseMins])

  // 倒計時處理
  useInterval(
    () => {
      if (!isClient || !newWindow.current) return

      if (newWindow.current.closed) {
        handleWindowClose()
        return
      }

      if (countDown === 0) {
        handleTimeout()
        return
      }

      setCountDown((prev) => prev - 1)
    },
    startCountDown ? 1000 : null
  )

  // 視窗關閉處理
  const handleWindowClose = () => {
    setStartCountDown(false)
    setCountDown(60 * autoCloseMins)
    publish('stop-countdown')
    publish('cancel')
    console.warn('錯誤:002-因為跳出視窗關閉無法取值')
  }

  // 超時處理
  const handleTimeout = () => {
    setStartCountDown(false)
    setCountDown(60 * autoCloseMins)
    publish('cancel')
    console.warn('錯誤:003-因為倒數時間已到無法取值')
    if (newWindow.current) {
      newWindow.current.close()
    }
  }

  // 開啟視窗
  const openWindow = () => {
    if (!isClient) return
    if (!serverCallbackUrl) {
      console.error('錯誤:001-必要。伺服器7-11運送商店用Callback路由網址')
      return
    }

    const url = `https://emap.presco.com.tw/c2cemap.ashx?eshopid=870&&servicetype=1&url=${serverCallbackUrl}`
    newWindow.current = popupCenter(url, title, w, h)
    setStartCountDown(true)
  }

  // 關閉視窗
  const closeWindow = () => {
    if (!isClient || !newWindow.current) return
    newWindow.current.close()
    setStartCountDown(false)
  }

  return { store711, openWindow, closeWindow }
}

export function useShip711StoreCallback(keyLocalStorage = 'store711') {
  const [storedValue, setValue] = useLocalStorage(keyLocalStorage, initialStore)
  const router = useRouter()

  useEffect(() => {
    if (!isClient || !router.isReady) return

    try {
      if (window.opener) {
        window.opener.focus()
        // 使用安全的方式發送事件
        const sendEvent = (eventName, detail = null) => {
          const event = detail
            ? new CustomEvent(eventName, { detail })
            : new CustomEvent(eventName)
          window.opener.document.dispatchEvent(event)
        }

        sendEvent('stop-countdown')
        sendEvent('set-store', router.query)
      }

      setValue(router.query)

      // 安全地關閉視窗
      if (window.close) {
        window.setTimeout(() => window.close(), 100)
      }
    } catch (error) {
      console.error('關閉視窗時發生錯誤:', error)
    }
  }, [router.isReady, router.query, setValue])

  return null
}
