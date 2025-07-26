import React, { useState, useEffect } from 'react'
import BuyList from '@/components/dashboard/buy-list'
import { useAuth } from '@/hooks/use-auth'

// 定義常量
const BACKEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com'

export default function Test(props) {
  const [order, setOrder] = useState([])
  const { auth } = useAuth()
  const { userData } = auth
  const user_id = userData.user_id

  const getOrder = async () => {
    const res = await fetch(`${BACKEND_URL}/api/buy-list/${user_id}`)
    const data = await res.json()

    if ((data.status == 'success') & !data.data) {
      return setOrder([])
    }
    setOrder(data.data)
  }

  useEffect(() => {
    getOrder()
  }, [user_id])

  return (
    <>
      {order.map((item, index) => {
        return <BuyList key={index} order={item} />
      })}
    </>
  )
}
