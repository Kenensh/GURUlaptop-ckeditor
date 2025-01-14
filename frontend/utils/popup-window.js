const isClient = typeof window !== 'undefined'

// 檢測移動設備 - 優化錯誤處理和類型檢查
const isMobile = () => {
  if (!isClient) return false

  try {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      throw new Error('Navigator or userAgent not available')
    }

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

// 取得螢幕資訊 - 增強型別安全性
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
    // 確保所有值都有合理的預設值
    const screenX = Math.max(window?.screenX ?? window?.screenLeft ?? 0, 0)
    const screenY = Math.max(window?.screenY ?? window?.screenTop ?? 0, 0)
    const outerWidth = Math.max(
      window?.outerWidth ?? document?.documentElement?.clientWidth ?? 0,
      0
    )
    const outerHeight = Math.max(
      (window?.outerHeight ?? document?.documentElement?.clientHeight ?? 0) -
        22,
      0
    )

    console.log('[PopupWindow] Screen info detected:', {
      screenX,
      screenY,
      outerWidth,
      outerHeight,
      windowExists: isClient,
      documentExists: typeof document !== 'undefined',
      timestamp: new Date().toISOString(),
    })

    return { screenX, screenY, outerWidth, outerHeight, error: null }
  } catch (error) {
    console.error('[PopupWindow] Screen info detection failed:', {
      error: error.message,
      stack: error.stack,
      windowDimensions: isClient
        ? { width: window?.innerWidth, height: window?.innerHeight }
        : null,
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

// 主要彈窗函數 - 增加安全檢查
export function popupCenter(url, title, w, h) {
  if (!isClient) {
    console.info('[PopupWindow] Popup attempted in server environment')
    return null
  }

  if (!url) {
    console.error('[PopupWindow] URL is required')
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

    // 確保計算值為正數
    const V = Math.max(
      screenX < 0 ? (window?.screen?.width ?? 0) + screenX : screenX,
      0
    )
    const left = Math.max(
      parseInt(V + (outerWidth - (targetWidth ?? 0)) / 2, 10),
      0
    )
    const top = Math.max(
      parseInt(screenY + (outerHeight - (targetHeight ?? 0)) / 2.5, 10),
      0
    )

    const features = [
      targetWidth !== null && `width=${targetWidth}`,
      targetHeight !== null && `height=${targetHeight}`,
      `left=${left}`,
      `top=${top}`,
      'scrollbars=1',
    ].filter(Boolean)

    console.log('[PopupWindow] Attempting to open window:', {
      url,
      title,
      dimensions: { width: w, height: h },
      calculated: { left, top },
      features: features.join(','),
      isMobile: mobile,
      timestamp: new Date().toISOString(),
    })

    const newWindow = window.open(url, title, features.join(','))

    if (newWindow && window?.focus) {
      setTimeout(() => {
        try {
          newWindow.focus()
          console.log('[PopupWindow] Window opened and focused successfully')
        } catch (error) {
          console.warn('[PopupWindow] Focus failed:', error.message)
        }
      }, 0)
    }

    return newWindow
  } catch (error) {
    console.error('[PopupWindow] Window creation failed:', {
      url,
      title,
      dimensions: { width: w, height: h },
      error: error.message,
      stack: error.stack,
      browserInfo: isClient
        ? {
            userAgent: navigator?.userAgent,
            viewport: {
              width: window?.innerWidth,
              height: window?.innerHeight,
            },
          }
        : null,
      timestamp: new Date().toISOString(),
    })
    return null
  }
}

// 事件處理相關函數 - 優化錯誤處理
const createSafeEventHandler = (action) => (eventName, listener) => {
  if (!isClient || !document) {
    console.info(`[EventSystem] ${action} attempted in server environment`)
    return
  }

  if (!eventName) {
    console.error(`[EventSystem] ${action} failed: eventName is required`)
    return
  }

  if (typeof listener !== 'function') {
    console.error(`[EventSystem] ${action} failed: listener must be a function`)
    return
  }

  try {
    document[action](eventName, listener)
    console.log(`[EventSystem] ${action} successful:`, {
      eventName,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[EventSystem] ${action} failed:`, {
      eventName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }
}

export const subscribe = createSafeEventHandler('addEventListener')
export const unsubscribe = createSafeEventHandler('removeEventListener')

export function publish(eventName, data) {
  if (!isClient || !document) {
    console.info('[EventSystem] Event publish attempted in server environment')
    return
  }

  if (!eventName) {
    console.error('[EventSystem] Event publish failed: eventName is required')
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
