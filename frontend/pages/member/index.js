import { useRouter } from 'next/router'

// only redirect to member/login
export default function MemberIndex() {
  const router = useRouter()
  // Make sure we're in the browser
  if (typeof window !== 'undefined') {
    router.push('/member/login')
  }
  return <></>
}
// 段代碼的目的是在瀏覽器中自動將用戶重定向到 /member/login 頁面。

// typeof window !== 'undefined'：這一行是用來確保代碼只在瀏覽器環境中運行，而不在服務器端運行。因為在服務器端 window 是未定義的。如果你不檢查這個，router.push 會在服務器端渲染時出錯。

// router.push('/member/login')：這個方法會將用戶重定向到 /member/login 頁面。
