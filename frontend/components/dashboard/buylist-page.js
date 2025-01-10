import React, { useState, useEffect } from 'react'
import BuyList from '@/components/dashboard/buy-list'
import { useAuth } from '@/hooks/use-auth'

export default function BuylistPage(props) {
  const { orderStatus } = props
  const [order, setOrder] = useState(null) // 改為 null 作為初始值
  const [whereClause, setWhereClause] = useState(orderStatus)
  const [user_id, setUser_id] = useState('0')
  const { auth } = useAuth()
  const { userData } = auth

  useEffect(() => {
    if (userData?.user_id) {
      // 添加可選鏈運算符
      setUser_id(userData.user_id)
    }
  }, [userData])

  const getOrder = async () => {
    try {
      if (!user_id || user_id === '0') return // 添加防護

      const res = await fetch(`http://localhost:3005/api/buy-list/${user_id}`)
      const data = await res.json()

      if (data.status === 'success') {
        setOrder(data.data || []) // 確保設置空陣列
      } else {
        console.error('獲取訂單失敗:', data.message)
        setOrder([])
      }
    } catch (error) {
      console.error('獲取訂單錯誤:', error)
      setOrder([])
    }
  }

  useEffect(() => {
    if (user_id !== '0') {
      getOrder()
    }
  }, [user_id])

  // 添加載入中的狀態
  if (order === null) {
    return (
      <div className="text-center mt-5">
        <h2>載入中...</h2>
      </div>
    )
  }

  return (
    <>
      {(!order || order.length === 0) && (
        <div className="text-center mt-5">
          <h2>目前沒有訂單</h2>
        </div>
      )}
      {order &&
        order.length > 0 &&
        order.map((item, index) => <BuyList key={index} order={item} />)}
    </>
  )
}
