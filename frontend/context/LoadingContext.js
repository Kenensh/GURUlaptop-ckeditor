import React, { createContext, useContext, useState, useEffect } from 'react'

const LoadingContext = createContext()

export const LoadingProviderAnimation = ({
  children,
  close = 3,
  CustomLoader,
  initialState = true,
}) => {
  const [isLoading, setIsLoading] = useState(initialState)

  useEffect(() => {
    if (initialState) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, close * 1000)

      return () => clearTimeout(timer)
    }
  }, [close, initialState])

  const showLoading = () => setIsLoading(true)
  const hideLoading = () => setIsLoading(false)

  // 加入除錯日誌
  useEffect(() => {
    console.log('Loading state changed:', isLoading)
  }, [isLoading])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        showLoading,
        hideLoading,
        setIsLoading,
      }}
    >
      {children}
      {isLoading && CustomLoader && <CustomLoader />}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
