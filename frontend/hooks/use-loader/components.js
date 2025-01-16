import dynamic from 'next/dynamic'
import { PacmanLoader } from 'react-spinners'

// 動態導入 Lottie
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// 其他 imports...
const isClient = typeof window !== 'undefined'

export function DefaultLoader({ show = true }) {
  if (!isClient) return null
  return (
    <div className={`semi-loader ${show ? '' : 'semi-loader--hide'}`}></div>
  )
}

export function LoaderText({ text = 'loading', show = false }) {
  if (!isClient) return null
  return (
    <div className={`loading-text-bg ${show ? '' : 'loading-text--hide'}`}>
      <div className={`loading-text ${show ? '' : 'loading-text--hide'}`}>
        {text}...
      </div>
    </div>
  )
}

export function CatLoader({ show = false }) {
  if (!isClient) return null
  return (
    <div className={`cat-loader-bg ${show ? '' : 'cat-loader--hide'}`}>
      <Lottie
        className={`cat-loader ${show ? '' : 'cat-loader--hide'}`}
        animationData={catAnimation}
      />
    </div>
  )
}

export function NikeLoader({ show = false }) {
  if (!isClient) return null
  return (
    <div className={`nike-loader-bg ${show ? '' : 'nike-loader--hide'}`}>
      <Lottie
        className={`nike-loader ${show ? '' : 'nike-loader--hide'}`}
        animationData={nikeAnimation}
      />
    </div>
  )
}

export function NoLoader({ show = false }) {
  return null
}
