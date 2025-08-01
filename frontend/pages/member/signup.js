import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Swal from 'sweetalert2'
import Header from '@/components/layout/default-layout/header'
import MyFooter from '@/components/layout/default-layout/my-footer'
import styles from '@/styles/signUpForm.module.scss'
import Head from 'next/head'
import GlowingText from '@/components/dashboard/glowing-text/glowing-text'

// 確保使用正確的後端 URL
const isClient = typeof window !== 'undefined'
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 
  (isClient && window.location.hostname === 'localhost' ? 
    'http://localhost:3005' : 
    'https://gurulaptop-ckeditor.onrender.com')

export default function Signup() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表單資料
  const [user, setUser] = useState({
    email: '',
    password: '',
    confirmpassword: '',
    phone: '',
    birthdate: '',
    gender: '',
    agree: false,
  })

  // 錯誤訊息
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmpassword: '',
    gender: '',
    agree: '',
  })

  // 密碼顯示控制
  const [showpassword, setShowpassword] = useState(false)
  const [showConfirmpassword, setShowConfirmpassword] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // 密碼驗證規則
  const validatePassword = (password) => {
    const rules = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    }

    const messages = {
      minLength: '密碼至少需要8個字元',
      hasUpperCase: '需要包含大寫字母',
      hasLowerCase: '需要包含小寫字母',
      hasNumber: '需要包含數字',
    }

    return Object.entries(rules)
      .filter(([rule, valid]) => !valid)
      .map(([rule]) => messages[rule])
  }

  // 處理輸入變化
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target
    setUser((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!user.email || !emailRegex.test(user.email)) {
      newErrors.email = '請輸入有效的Email格式'
    }

    if (!user.password) {
      newErrors.password = '密碼為必填'
    } else {
      const passwordErrors = validatePassword(user.password)
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0]
      }
    }

    if (user.password !== user.confirmpassword) {
      newErrors.confirmpassword = '密碼與確認密碼不相符'
    }

    if (!user.agree) {
      newErrors.agree = '請先同意會員註冊條款'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 表單提交
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitError('')
      setIsSubmitting(true)

      if (!validateForm()) {
        setIsSubmitting(false)
        return
      }

      const { confirmpassword, agree, ...submitData } = user

      console.log(`嘗試發送註冊請求到: ${BACKEND_URL}/api/auth/signup`);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('註冊回應錯誤:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        // 嘗試解析錯誤訊息
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || '註冊請求失敗');
        } catch (parseError) {
          throw new Error(`註冊請求失敗 (${response.status})`);
        }
      }

      const result = await response.json();

      if (result.status === 'success') {
        await Swal.fire({
          title: '註冊成功！',
          text: '歡迎加入我們！',
          icon: 'success',
          confirmButtonText: '前往登入',
          confirmButtonColor: '#805AF5',
        });

        router.push('/member/login');
      } else {
        throw new Error(result.message || '註冊失敗，但伺服器沒有提供具體原因');
      }
    } catch (error) {
      console.error('註冊處理過程中發生錯誤:', error);
      const errorMessage = error.message || '註冊過程中發生錯誤';

      setSubmitError(errorMessage);

      await Swal.fire({
        title: '註冊失敗',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: '確定',
        confirmButtonColor: '#805AF5',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>註冊</title>
      </Head>

      <Header />
      <div className={styles['gradient-bg']}>
        <Image
          src="/bgi/signup_bgi.png"
          alt="background"
          layout="fill"
          quality={100}
        />
        <div className="container">
          <div className="row align-items-center">
            <div
              className={`${styles.left} col-sm-12  col-md-6 col-lg-6 col d-flex flex-column justify-content-start`}
            >
              <i>
                <GlowingText
                  text="Sign Up to"
                  className={`text-white text-md-start`}
                />
              </i>
              <i>
                <GlowingText
                  text="LaptopGuru"
                  className={`text-white text-md-start`}
                />
              </i>
            </div>
            <div
              className={`${styles.right} align-item-center col ${styles['signup-right']} text-white col-sm-12  col-md-11 col-lg-5`}
            >
              <div className={`${styles.tabs} d-flex justify-content-between`}>
                <Link
                  className={`${styles.hover} text-decoration-none text-white`}
                  href="/member/login"
                >
                  登入
                </Link>
                <span className="text-white">| </span>
                <Link
                  className={`${styles.hover} text-decoration-none text-white`}
                  href="/member/signup"
                >
                  註冊
                </Link>
              </div>
              {submitError && (
                <div className="alert alert-danger" role="alert">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-3">
                <div className={styles['inputs-group']}>
                  <div className="mb-3">
                    <label htmlFor="email" className={styles.white}>
                      帳號(信箱)
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`form-control ${styles.inputs}`}
                      value={user.email}
                      onChange={handleFieldChange}
                    />
                    {errors.email && (
                      <div className="error">{errors.email}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className={styles.white}>
                      密碼
                    </label>
                    <input
                      type={showpassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`form-control ${styles.inputs}`}
                      value={user.password}
                      onChange={handleFieldChange}
                      maxLength={62}
                    />
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="showpassword"
                        checked={showpassword}
                        onChange={() => setShowpassword(!showpassword)}
                        className="form-check-input"
                      />
                      <label
                        htmlFor="showpassword"
                        className="text-white form-check-label"
                      >
                        顯示密碼
                      </label>
                    </div>
                    {errors.password && (
                      <div className="error">{errors.password}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmpassword" className={styles.white}>
                      確認密碼
                    </label>
                    <input
                      type={showConfirmpassword ? 'text' : 'password'}
                      id="confirmpassword"
                      name="confirmpassword"
                      className={`form-control ${styles.inputs}`}
                      value={user.confirmpassword}
                      onChange={handleFieldChange}
                    />
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="showConfirmpassword"
                        checked={showConfirmpassword}
                        onChange={() =>
                          setShowConfirmpassword(!showConfirmpassword)
                        }
                        className="form-check-input"
                      />
                      <label
                        htmlFor="showConfirmpassword"
                        className="text-white form-check-label"
                      >
                        顯示密碼
                      </label>
                    </div>
                    {errors.confirmpassword && (
                      <div className="error">{errors.confirmpassword}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className={styles.white}>
                      手機
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`form-control ${styles.inputs}`}
                      value={user.phone}
                      onChange={handleFieldChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="birthdate" className={styles.white}>
                      生日
                    </label>
                    <div className="">
                      <input
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        className={`form-control ${styles.inputs}`}
                        value={user.birthdate}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="gender" className={styles.white}>
                      性別
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className={`form-select ${styles.inputs}`}
                      value={user.gender}
                      onChange={handleFieldChange}
                    >
                      <option value="">請選擇</option>
                      <option value="female">女</option>
                      <option value="male">男</option>
                      <option value="undisclosed">不透漏</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="agree"
                        name="agree"
                        checked={user.agree}
                        onChange={handleFieldChange}
                        className="form-check-input"
                      />
                      <label
                        htmlFor="agree"
                        className="text-white form-check-label"
                      >
                        我同意網站會員註冊條款
                      </label>
                    </div>
                    {errors.agree && (
                      <div className="error">{errors.agree}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '處理中...' : '送出'}
                  </button>
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
Signup.getLayout = (page) => page
