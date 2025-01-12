import { useRouter } from 'next/router'
import { useEffect } from 'react'

const isClient = typeof window !== 'undefined'

export default function ProductIndex() {
  const router = useRouter()

  useEffect(() => {
    if (isClient) {
      router.push('/product/list')
    }
  }, [])

  return <></>
}
