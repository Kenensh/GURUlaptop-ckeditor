import React, { useState, useEffect } from 'react'
import styles from '@/styles/signUpForm.module.scss'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/use-auth'
import { MdOutlineEmail } from 'react-icons/md'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { useLoader } from '@/hooks/use-loader'
import Head from 'next/head'
import Header from '@/components/layout/default-layout/header'
import MyFooter from '@/components/layout/default-layout/my-footer'
import GlowingText from '@/components/dashboard/glowing-text/glowing-text'

// 定義 API URL - 使用環境變數
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com')

export default function LogIn() {
  // 狀態管理
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hooks
  const router = useRouter()
  const { login } = useAuth()
  const { showLoader, hideLoader } = useLoader()

  // 表單輸入處理
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // 清除對應欄位的錯誤訊息
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  // 表單驗證
  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = '請輸入電子郵件'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址'
    }

    if (!formData.password) {
      newErrors.password = '請輸入密碼'
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼長度至少需要6個字元'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 表單提交處理
  const handleSubmit = async (e) => {
    e.preventDefault()

    // 檢查表單
    if (!validateForm()) {
      console.log('表單驗證失敗:', errors)
      return
    }

    setIsSubmitting(true)
    showLoader()

    try {
      console.log('開始登入流程:', { email: formData.email })

      // 發送登入請求
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      console.log('登入響應狀態:', response.status)

      if (!response.ok) {
        throw new Error(`登入失敗: ${response.status}`)
      }

      const result = await response.json()
      console.log('登入響應內容:', result)

      if (result.status === 'success' && result.data?.user) {
        console.log('開始更新 auth context')
        const loginResult = await login(result.data.user)

        if (loginResult.status === 'success') {
          console.log('登入成功，準備跳轉')
          const returnUrl = router.query.returnUrl || '/dashboard'
          await router.replace(returnUrl)
        } else {
          throw new Error(loginResult.message || '登入失敗')
        }
      } else {
        throw new Error(result.message || '登入失敗')
      }
    } catch (error) {
      console.error('登入錯誤:', error)
      setErrors({
        general: error.message || '登入過程發生錯誤，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
      hideLoader()
    }
  }

  // 顯示/隱藏密碼
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  // 渲染錯誤訊息
  const renderError = (field) => {
    return errors[field] ? (
      <div className="text-red-500 text-sm mt-1">{errors[field]}</div>
    ) : null
  }

  return (
    <>
      <Head>
        <title>登入 | GuruLaptop</title>
      </Head>

      <Header />

      <div className={`${styles['gradient-bg']} ${styles['login-bg']}`}>
        <Image
          src="/bgi/signup_bgi.png"
          alt="background"
          layout="fill"
          quality={100}
          priority
        />

        <div className="container">
          <div
            className={`row ${styles['content-row']} d-flex justify-content-center align-items-center`}
          >
            {/* 左側標題區 */}
            <div
              className={`${styles.left} col d-flex flex-column justify-content-start col-sm-12 col-md-11 col-lg-6`}
            >
              <i>
                <GlowingText
                  text="Log in to"
                  className="text-white text-md-start text-lg-start"
                />
              </i>
              <i>
                <GlowingText
                  text="GuruLaptop"
                  className={`text-white text-center text-lg-start text-md-start ${styles.glowingText}`}
                />
              </i>
            </div>

            {/* 右側表單區 */}
            <div className={`${styles.right} col-sm-12 col-md-11 col-lg-5`}>
              <div className={`${styles.tabs} d-flex justify-content-between`}>
                <Link
                  className={`${styles.hover} text-decoration-none text-white`}
                  href="/member/login"
                >
                  登入
                </Link>
                <span className="text-white">|</span>
                <Link
                  className={`${styles.hover} text-decoration-none text-white`}
                  href="/member/signup"
                >
                  註冊
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="position-relative">
                <div className={styles['inputs-group']}>
                  {/* 電子郵件輸入區 */}
                  <div className="position-relative mt-5">
                    <label
                      htmlFor="email"
                      className={`form-label text-white ${styles.hover}`}
                    >
                      帳號(信箱)
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-control ${styles.inputs} ${
                        errors.email ? 'border-danger' : ''
                      }`}
                      disabled={isSubmitting}
                      required
                    />
                    <MdOutlineEmail
                      className={styles['input-icon']}
                      size={22}
                      style={{ color: '#E0B0FF' }}
                    />
                    {renderError('email')}
                  </div>

                  {/* 密碼輸入區 */}
                  <div className="position-relative mt-5">
                    <label
                      htmlFor="password"
                      className={`form-label text-white ${styles.hover}`}
                    >
                      密碼
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`form-control ${styles.inputs} ${
                        errors.password ? 'border-danger' : ''
                      }`}
                      disabled={isSubmitting}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="btn position-absolute end-0 top-50 border-0"
                      style={{
                        background: 'none',
                        transform: 'translateY(calc(50% - 20px))',
                        right: '10px',
                      }}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <AiOutlineEyeInvisible size={20} color="#E0B0FF" />
                      ) : (
                        <AiOutlineEye size={20} color="#E0B0FF" />
                      )}
                    </button>
                    {renderError('password')}
                  </div>

                  {/* 一般錯誤訊息顯示區 */}
                  {errors.general && (
                    <div className="text-danger mt-3 text-center">
                      {errors.general}
                    </div>
                  )}

                  {/* 底部按鈕區 */}
                  <div className="d-flex flex-wrap justify-content-around mt-4">
                    <Link
                      className={`text-white text-decoration-none ${styles.hover}`}
                      href="/member/forget-password"
                    >
                      忘記密碼
                    </Link>

                    <button
                      type="submit"
                      className={`text-white btn btn-primary border-0 ${styles.hover} ${styles.button}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '登入中...' : '送出'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <MyFooter />

      <style jsx>{`
        .error {
          color: red;
          font-size: 16px;
          margin-top: 0.25rem;
        }
      `}</style>
    </>
  )
}

LogIn.getLayout = (page) => page
