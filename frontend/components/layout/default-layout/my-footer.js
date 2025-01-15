import Link from 'next/link'
import Image from 'next/image'

export default function MyFooter() {
  return (
    <footer>
      <div className="container footer-side">
        <div className="row m-3 border-bottom border-secondary footer-row">
          <div className="footer-link col-2">
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              關於我們
            </Link>
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              加入我們
            </Link>
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              最新優惠
            </Link>
          </div>
          <div className="footer-link col-2">
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              產品列表
            </Link>
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              租賃規則
            </Link>
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              比看看
            </Link>
          </div>
          <div className="footer-link col">
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              最新文章
            </Link>
            <Link
              className="text-secondary mb-3 d-block text-decoration-none"
              href=""
            >
              來揪團
            </Link>
          </div>
          <div className="col-3 d-flex justify-content-end footer-logo-container">
            <div className="footer-logo">
              <Image
                src="/logo2.svg"
                alt="網站 Logo"
                width={150}
                height={50}
                priority
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </div>
          </div>
          <div className="mb-4" />
        </div>
        <div className="p-3 footer-row">
          <div className="col mb-3">
            <Link
              className="text-secondary mb-2 text-decoration-none me-3"
              href=""
            >
              <Image
                src="/Icon-fb2.svg"
                alt="Facebook 圖標"
                width={24}
                height={24}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Link>
            <Link className="text-secondary mb-2 text-decoration-none" href="">
              <Image
                src="/Icon-ig2.svg"
                alt="Instagram 圖標"
                width={24}
                height={24}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Link>
          </div>
          <div className="col text-secondary text-end">© 2024 Hello, Inc.</div>
        </div>
      </div>
    </footer>
  )
}
