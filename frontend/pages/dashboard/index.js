import React, { useEffect, useState } from 'react'
import { Nav, Tab } from 'react-bootstrap'
import { useAuth } from '@/hooks/use-auth'
import Head from 'next/head'

// 組件導入
import UserProfile from '@/components/dashboard/userInfoEdit'
import MembershipLevels from '@/components/dashboard/membership-levels'
import EditPassword from '@/components/dashboard/EditPassword'
import CouponList from '@/components/coupon/coupon-list-components'
import CouponUser from '@/components/coupon/coupon-user-components'
import EventManagement from '@/components/event/EventManagement'
import GroupManagement from '@/components/group/GroupManagement'
import BuylistPage from '@/components/dashboard/buylist-page'
import Favorites from '@/components/product/favorites'
import BlogUserOverview from '@/components/blog/bloguseroverview'

export default function DashboardIndex() {
  // 狀態管理
  const [activeKey, setActiveKey] = useState('home')
  const [couponActiveKey, setCouponActiveKey] = useState('available')
  const [subActiveKey, setSubActiveKey] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)

  // Auth Hook
  const { auth } = useAuth()

  // 用戶檢查
  useEffect(() => {
    const checkUserAuth = async () => {
      const requestId = Math.random().toString(36).substring(7)
      try {
        if (!auth?.isAuth) {
          window.location.href = '/member/login'
          throw new Error('未授權的存取')
        }
      } catch (error) {
        console.error(`[${requestId}] 授權檢查錯誤:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAuth()
  }, [auth.isAuth])

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
    return render ? render() : null
  }

  if (isLoading) {
    return <div className="text-center p-5">載入中...</div>
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
