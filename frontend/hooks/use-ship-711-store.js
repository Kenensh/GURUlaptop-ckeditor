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
  const [storedValue, setValue] = useLocalStorage(keyLocalStorage, initialStore)
  const newWindow = useRef(null)
  const [store711, setStore711] = useState(initialStore)
  const [startCountDown, setStartCountDown] = useState(false)
  const [countDown, setContDown] = useState(60 * autoCloseMins)

  useEffect(() => {
    if (!isClient) return

    if (storedValue?.storeid && enableLocalStorage) {
      setStore711(storedValue)
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    const handleStopCountdown = () => setStartCountDown(false)
    const handleSetStore = (e) => setStore711(e.detail)
    const handleCancel = () => {
      setStartCountDown(false)
      setContDown(60 * autoCloseMins)
      console.warn('錯誤:001-因為跳出視窗關閉無法取值')
    }

    subscribe('stop-countdown', handleStopCountdown)
    subscribe('set-store', handleSetStore)
    subscribe('cancel', handleCancel)

    return () => {
      unsubscribe('set-store')
      unsubscribe('stop-countdown')
      unsubscribe('cancel')
    }
  }, [autoCloseMins])

  useInterval(
    () => {
      if (!isClient || !newWindow.current) return

      if (newWindow.current.closed) {
        setStartCountDown(false)
        setContDown(60 * autoCloseMins)
        publish('stop-countdown')
        publish('cancel')
        console.warn('錯誤:002-因為跳出視窗關閉無法取值')
        return
      }

      if (countDown === 0) {
        setStartCountDown(false)
        setContDown(60 * autoCloseMins)
        publish('cancel')
        console.warn('錯誤:003-因為倒數時間已到無法取值')
        if (newWindow.current) {
          newWindow.current.close()
        }
        return
      }

      setContDown((prev) => prev - 1)
    },
    startCountDown ? 1000 : null
  )

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
        window.opener.document.dispatchEvent(new CustomEvent('stop-countdown'))
        window.opener.document.dispatchEvent(
          new CustomEvent('set-store', {
            detail: router.query,
          })
        )
      }

      setValue(router.query)

      if (window.close) {
        window.close()
      }
    } catch (error) {
      console.error('關閉視窗時發生錯誤:', error)
    }
  }, [router.isReady, router.query, setValue])

  return null
}
