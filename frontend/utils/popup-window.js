const isClient = typeof window !== 'undefined'

// 檢測移動設備
const isMobile = () => {
  if (!isClient) return false

  try {
    const userAgent = navigator.userAgent
    const isMobileDevice =
      /\b(iPhone|iP[ao]d)/.test(userAgent) ||
      /\b(iP[ao]d)/.test(userAgent) ||
      /Android/i.test(userAgent) ||
      /Mobile/i.test(userAgent)

    console.log('[PopupWindow] Device detection:', {
      userAgent,
      isMobile: isMobileDevice,
      timestamp: new Date().toISOString(),
    })

    return isMobileDevice
  } catch (error) {
    console.error('[PopupWindow] Mobile detection failed:', {
      error: error.message,
      stack: error.stack,
      userAgent: navigator?.userAgent,
      timestamp: new Date().toISOString(),
    })
    return false
  }
}

// 取得螢幕資訊的安全函數
const getScreenInfo = () => {
  if (!isClient) {
    console.info('[PopupWindow] Running in server environment')
    return {
      screenX: 0,
      screenY: 0,
      outerWidth: 0,
      outerHeight: 0,
      error: null,
    }
  }

  try {
    const screenX = window?.screenX ?? window?.screenLeft ?? 0
    const screenY = window?.screenY ?? window?.screenTop ?? 0
    const outerWidth =
      window?.outerWidth ?? document?.documentElement?.clientWidth ?? 0
    const outerHeight =
      (window?.outerHeight ?? document?.documentElement?.clientHeight ?? 0) - 22

    console.log('[PopupWindow] Screen info detected:', {
      screenX,
      screenY,
      outerWidth,
      outerHeight,
      windowExists: typeof window !== 'undefined',
      documentExists: typeof document !== 'undefined',
      timestamp: new Date().toISOString(),
    })

    return { screenX, screenY, outerWidth, outerHeight, error: null }
  } catch (error) {
    console.error('[PopupWindow] Screen info detection failed:', {
      error: error.message,
      stack: error.stack,
      windowDimensions: {
        width: window?.innerWidth,
        height: window?.innerHeight,
      },
      timestamp: new Date().toISOString(),
    })
    return {
      screenX: 0,
      screenY: 0,
      outerWidth: 0,
      outerHeight: 0,
      error,
    }
  }
}

// 主要的彈窗函數
export function popupCenter(url, title, w, h) {
  if (!isClient) {
    console.info('[PopupWindow] Popup attempted in server environment')
    return null
  }

  try {
    const { screenX, screenY, outerWidth, outerHeight, error } = getScreenInfo()

    if (error) {
      console.error('[PopupWindow] Screen info error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
      return null
    }

    const mobile = isMobile()
    const targetWidth = mobile ? null : w
    const targetHeight = mobile ? null : h

    const V = screenX < 0 ? (window?.screen?.width ?? 0) + screenX : screenX
    const left = parseInt(V + (outerWidth - (targetWidth ?? 0)) / 2, 10)
    const right = parseInt(
      screenY + (outerHeight - (targetHeight ?? 0)) / 2.5,
      10
    )

    const features = []
    if (targetWidth !== null) features.push(`width=${targetWidth}`)
    if (targetHeight !== null) features.push(`height=${targetHeight}`)
    features.push(`left=${left}`)
    features.push(`top=${right}`)
    features.push('scrollbars=1')

    console.log('[PopupWindow] Attempting to open window:', {
      url,
      title,
      dimensions: { width: w, height: h },
      calculated: { left, right },
      features: features.join(','),
      isMobile: mobile,
      timestamp: new Date().toISOString(),
    })

    const newWindow = window.open(url, title, features.join(','))
    if (window?.focus && newWindow) {
      newWindow.focus()
      console.log('[PopupWindow] Window opened successfully')
    }

    return newWindow
  } catch (error) {
    console.error('[PopupWindow] Window creation failed:', {
      url,
      title,
      dimensions: { width: w, height: h },
      error: error.message,
      stack: error.stack,
      browserInfo: {
        userAgent: navigator?.userAgent,
        viewport: {
          width: window?.innerWidth,
          height: window?.innerHeight,
        },
      },
      timestamp: new Date().toISOString(),
    })
    return null
  }
}

// 事件處理函數工廠
const createSafeEventHandler = (action) => (eventName, listener) => {
  if (!isClient) {
    console.info(`[EventSystem] ${action} attempted in server environment`)
    return
  }

  try {
    if (typeof document?.[action] === 'function') {
      document[action](eventName, listener)
      console.log(`[EventSystem] ${action} successful:`, {
        eventName,
        hasListener: !!listener,
        timestamp: new Date().toISOString(),
      })
    } else {
      throw new Error(`Document ${action} is not a function`)
    }
  } catch (error) {
    console.error(`[EventSystem] ${action} failed:`, {
      eventName,
      hasDocument: typeof document !== 'undefined',
      hasListener: typeof listener === 'function',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }
}

export const subscribe = createSafeEventHandler('addEventListener')
export const unsubscribe = createSafeEventHandler('removeEventListener')

export function publish(eventName, data) {
  if (!isClient) {
    console.info('[EventSystem] Event publish attempted in server environment')
    return
  }

  try {
    if (typeof CustomEvent !== 'function') {
      throw new Error('CustomEvent is not supported')
    }

    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)
    console.log('[EventSystem] Event published successfully:', {
      eventName,
      hasData: !!data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[EventSystem] Event publishing failed:', {
      eventName,
      error: error.message,
      stack: error.stack,
      browserInfo: {
        hasCustomEvent: typeof CustomEvent === 'function',
        hasDocument: typeof document !== 'undefined',
      },
      timestamp: new Date().toISOString(),
    })
  }
}
