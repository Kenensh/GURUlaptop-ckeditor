import React, { useEffect, useState } from 'react'
import { Nav, Tab } from 'react-bootstrap'
import { useAuth } from '@/hooks/use-auth'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// 使用動態導入來避免初始加載時的複雜依賴
const UserProfile = dynamic(() => import('@/components/dashboard/userInfoEdit'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const MembershipLevels = dynamic(() => import('@/components/dashboard/membership-levels'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const EditPassword = dynamic(() => import('@/components/dashboard/EditPassword'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const CouponList = dynamic(() => import('@/components/coupon/coupon-list-components'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const CouponUser = dynamic(() => import('@/components/coupon/coupon-user-components'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const EventManagement = dynamic(() => import('@/components/event/EventManagement'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const GroupManagement = dynamic(() => import('@/components/group/GroupManagement'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const BuylistPage = dynamic(() => import('@/components/dashboard/buylist-page'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const Favorites = dynamic(() => import('@/components/product/favorites'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})
const BlogUserOverview = dynamic(() => import('@/components/blog/bloguseroverview'), {
  loading: () => <div>載入中...</div>,
  ssr: false
})

export default function DashboardIndex() {
  const [activeKey, setActiveKey] = useState('home')
  const [couponActiveKey, setCouponActiveKey] = useState('available')
  const [subActiveKey, setSubActiveKey] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Auth Hook - 必須在其他 useEffect 之前調用
  const { auth } = useAuth()

  useEffect(() => {
    const checkAuth = async () => {
      const requestId = Math.random().toString(36).substring(7)
      try {
        console.log(`[Dashboard ${requestId}] 檢查認證狀態:`, auth)
        
        if (!auth.isAuth && !auth.isLoading) {
          console.log(`[Dashboard ${requestId}] 未認證，重定向到登入頁面`)
          await router.replace('/member/login')
          return
        }
        
        if (auth.isAuth) {
          console.log(`[Dashboard ${requestId}] 認證成功，載入頁面`)
          setIsLoading(false)
        }
      } catch (error) {
        console.error(`[Dashboard ${requestId}] 認證檢查失敗:`, error)
        // 使用 window.location 作為後備方案
        window.location.href = '/member/login'
      }
    }

    // 只有在 auth 不是初始加載狀態時才執行檢查
    if (!auth.isLoading) {
      checkAuth()
    }
  }, [auth.isAuth, auth.isLoading, router])

  // 頁籤配置
  const sideNavConfigs = {
    home: [
      { key: 'profile', label: '檔案管理' },
      { key: 'EditPassword', label: '密碼修改' },
      { key: 'membership', label: '會員等級' },
    ],
    'shopping-record': [
      { key: 'all-orders', label: '全部訂單' },
      { key: 'processing', label: '未付款' },
      { key: 'completed', label: '已付款' },
    ],
    favorites: [
      { key: 'record', label: '收藏紀錄' },
      { key: 'history', label: '歷史紀錄' },
    ],
    'coupon-record': [
      { key: 'available', label: '優惠卷' },
      { key: 'used', label: '領取優惠卷' },
    ],
    'blog-record': [{ key: 'my-posts', label: '我的文章' }],
    'activity-record': [
      { key: 'upcoming', label: '即將參加' },
      { key: 'past', label: '歷史活動' },
    ],
    'group-record': [
      { key: 'my-groups', label: '我的揪團' },
      { key: 'joined', label: '已參加' },
    ],
  }

  // 獲取當前側邊導航
  const getCurrentSideNav = () => {
    return sideNavConfigs[activeKey] || []
  }

  // 處理側邊導航點擊
  const handleSideNavClick = (key) => {
    if (activeKey === 'coupon-record') {
      setCouponActiveKey(key)
    }
    setSubActiveKey(key)
  }

  // 渲染主頁內容
  const renderHome = (key) => {
    const components = {
      profile: UserProfile,
      membership: MembershipLevels,
      EditPassword: EditPassword,
    }

    const Component = components[key] || UserProfile
    return <Component />
  }

  // 渲染主要內容
  const renderMainContent = () => {
    try {
      const contentMap = {
        home: () => renderHome(subActiveKey),
        'shopping-record': () => <BuylistPage orderStatus={subActiveKey} />,
        'coupon-record': () =>
          couponActiveKey === 'available' ? <CouponUser /> : <CouponList />,
        'blog-record': () => <BlogUserOverview />,
        'activity-record': () => <EventManagement />,
        'group-record': () => <GroupManagement />,
        favorites: () => <Favorites />,
      }

      const render = contentMap[activeKey]
      if (!render) {
        console.warn(`[Dashboard] 未知的 activeKey: ${activeKey}`)
        return <div>頁面載入中...</div>
      }
      
      return render()
    } catch (error) {
      console.error('[Dashboard] 渲染內容錯誤:', error)
      return <div className="text-center p-3">載入失敗，請重新整理頁面</div>
    }
  }

  // 如果正在載入或認證中，顯示載入畫面
  if (isLoading || auth.isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div>載入中...</div>
      </div>
    )
  }

  // 如果未認證，不渲染內容（將在 useEffect 中重定向）
  if (!auth.isAuth) {
    return null
  }

  return (
    <>
      <Head>
        <title>會員中心 | GuruLaptop</title>
      </Head>

      <div className="container">
        <div className="row">
          <Tab.Container
            id="dashboard-tabs"
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
          >
            {/* 左側邊欄 */}
            <div className="col-md-2">
              <div className="text-center">
                <img
                  src={
                    auth?.userData?.image_path ||
                    (auth?.userData?.gender === 'male'
                      ? 'signup_login/undraw_profile_2.svg'
                      : auth?.userData?.gender === 'female'
                      ? 'signup_login/undraw_profile_1.svg'
                      : '/Vector.svg')
                  }
                  alt="Profile"
                  className="rounded-circle img-fluid mb-3"
                  style={{
                    width: '70px',
                    height: '70px',
                    objectFit: 'cover',
                  }}
                />
                <h5 className="mb-2">{auth?.userData?.name}</h5>
              </div>

              {/* 左側導航 */}
              <Nav className="flex-column">
                {getCurrentSideNav().map((item) => (
                  <Nav.Item key={item.key}>
                    <Nav.Link
                      onClick={() => handleSideNavClick(item.key)}
                      active={subActiveKey === item.key}
                      className="text-center"
                    >
                      {item.label}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </div>

            {/* 主內容區 */}
            <div className="col-md-10">
              {/* 上方導航 */}
              <Nav
                variant="tabs"
                className="mb-3"
                fill
                style={{ '--bs-nav-link-color': '#805AF5' }}
              >
                <Nav.Item>
                  <Nav.Link eventKey="home">會員中心</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="shopping-record">購買清單</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="favorites">收藏清單</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="coupon-record">優惠券</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="blog-record">部落格</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="activity-record">活動</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="group-record">揪團</Nav.Link>
                </Nav.Item>
              </Nav>

              {/* 內容區域 */}
              <Tab.Content className="mb-5">
                <Tab.Pane eventKey={activeKey} active>
                  {renderMainContent()}
                </Tab.Pane>
              </Tab.Content>
            </div>
          </Tab.Container>
        </div>
      </div>
    </>
  )
}

// 添加布局設定
DashboardIndex.requireAuth = true
