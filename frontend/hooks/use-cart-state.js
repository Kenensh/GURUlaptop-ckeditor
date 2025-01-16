import React, { useState, useContext, createContext, useEffect } from 'react'
import {
  init,
  initState,
  addOne,
  findOneById,
  updateOne,
  removeOne,
  incrementOne,
  decrementOne,
  generateCartState,
} from './cart-reducer-state'
import useLocalStorage from './use-localstorage'

const isClient = typeof window !== 'undefined'
const CartContext = createContext(null)

export const CartProvider = ({
  children,
  initialCartItems = [],
  localStorageKey = 'cart',
}) => {
  // 使用 useState 的延遲初始化功能
  const [cartItems, setCartItems] = useState(() => {
    if (!isClient) return initialCartItems

    try {
      const savedItems = localStorage.getItem(localStorageKey)
      return savedItems ? JSON.parse(savedItems) : initialCartItems
    } catch (error) {
      console.error('Failed to load cart items:', error)
      return initialCartItems
    }
  })

  const [cartState, setCartState] = useState(() => init(initialCartItems))
  const [storedValue, setValue] = useLocalStorage(localStorageKey, cartItems)

  // 優化 useEffect
  useEffect(() => {
    if (!isClient) return

    try {
      if (JSON.stringify(cartItems) !== storedValue) {
        setValue(cartItems)
      }
      setCartState(generateCartState(cartState, cartItems))
    } catch (error) {
      console.error('Error updating cart state:', error)
    }
  }, [cartItems])

  // 所有修改購物車的方法都加上 isClient 檢查
  const addItem = (item) => {
    if (!isClient) return
    setCartItems(addOne(cartItems, item))
  }

  const removeItem = (id) => {
    if (!isClient) return
    setCartItems(removeOne(cartItems, id))
  }

  const updateItem = (item) => {
    if (!isClient) return
    setCartItems(updateOne(cartItems, item))
  }

  const updateItemQty = (id, quantity) => {
    if (!isClient) return
    const item = findOneById(cartItems, id)
    if (!item.id) return
    const updateItem = { ...item, quantity }
    setCartItems(updateOne(cartItems, updateItem))
  }

  const clearCart = () => {
    if (!isClient) return
    setCartItems([])
  }

  const isInCart = (id) => {
    return cartItems.some((item) => item.id === id)
  }

  const increment = (id) => {
    if (!isClient) return
    setCartItems(incrementOne(cartItems, id))
  }

  const decrement = (id) => {
    if (!isClient) return
    setCartItems(decrementOne(cartItems, id))
  }

  // 服務器端渲染時返回初始狀態
  if (!isClient) {
    return (
      <CartContext.Provider
        value={{
          cart: init(initialCartItems),
          items: initialCartItems,
          addItem: () => {},
          removeItem: () => {},
          updateItem: () => {},
          updateItemQty: () => {},
          clearCart: () => {},
          isInCart: () => false,
          increment: () => {},
          decrement: () => {},
        }}
      >
        {children}
      </CartContext.Provider>
    )
  }

  return (
    <CartContext.Provider
      value={{
        cart: cartState,
        items: cartState.items,
        addItem,
        removeItem,
        updateItem,
        updateItemQty,
        clearCart,
        isInCart,
        increment,
        decrement,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
