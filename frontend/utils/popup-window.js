const isClient = typeof window !== 'undefined'

// 檢測移動設備
const isMobile = () => {
  if (!isClient) return false

  const userAgent = navigator.userAgent
  return (
    /\b(iPhone|iP[ao]d)/.test(userAgent) ||
    /\b(iP[ao]d)/.test(userAgent) ||
    /Android/i.test(userAgent) ||
    /Mobile/i.test(userAgent)
  )
}

// 取得螢幕資訊的安全函數
const getScreenInfo = () => {
  if (!isClient)
    return { screenX: 0, screenY: 0, outerWidth: 0, outerHeight: 0 }

  const screenX = window.screenX ?? window.screenLeft ?? 0
  const screenY = window.screenY ?? window.screenTop ?? 0
  const outerWidth =
    window.outerWidth ?? document.documentElement.clientWidth ?? 0
  const outerHeight =
    (window.outerHeight ?? document.documentElement.clientHeight ?? 0) - 22

  return { screenX, screenY, outerWidth, outerHeight }
}

// 主要的彈窗函數
export function popupCenter(url, title, w, h) {
  if (!isClient) return null

  const { screenX, screenY, outerWidth, outerHeight } = getScreenInfo()
  const mobile = isMobile()

  const targetWidth = mobile ? null : w
  const targetHeight = mobile ? null : h
  const V = screenX < 0 ? window.screen.width + screenX : screenX
  const left = parseInt(V + (outerWidth - targetWidth) / 2, 10)
  const right = parseInt(screenY + (outerHeight - targetHeight) / 2.5, 10)

  const features = []
  if (targetWidth !== null) features.push(`width=${targetWidth}`)
  if (targetHeight !== null) features.push(`height=${targetHeight}`)
  features.push(`left=${left}`)
  features.push(`top=${right}`)
  features.push('scrollbars=1')

  try {
    const newWindow = window.open(url, title, features.join(','))
    if (window.focus && newWindow) {
      newWindow.focus()
    }
    return newWindow
  } catch (error) {
    console.error('彈窗開啟失敗:', error)
    return null
  }
}

// 事件處理相關函數
const createSafeEventHandler = (action) => (eventName, listener) => {
  if (!isClient) return
  try {
    document[action](eventName, listener)
  } catch (error) {
    console.error(`事件${action}失敗:`, error)
  }
}

export const subscribe = createSafeEventHandler('addEventListener')
export const unsubscribe = createSafeEventHandler('removeEventListener')

export function publish(eventName, data) {
  if (!isClient) return

  try {
    const event = new CustomEvent(eventName, { detail: data })
    document.dispatchEvent(event)
  } catch (error) {
    console.error('事件發布失敗:', error)
  }
}
