import dynamic from 'next/dynamic'
import { PacmanLoader } from 'react-spinners'

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

export function NoLoader({ show = false }) {
  return null
}

export default {
  DefaultLoader,
  LoaderText,
  NoLoader,
}
