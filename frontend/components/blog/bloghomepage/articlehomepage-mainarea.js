import React from 'react' // 只需要 React，不需要 useState 和 useEffect

export default function BlogDetailMainArea() {
  // 因為是靜態內容，可以將文字抽出為常量
  const BLOG_TITLE = 'Blog'
  const BLOG_SUBTITLE = '分享你在 GURU 的完美體驗！'

  return (
    <div className="container-fluid BlogSectionContainer">
      <div className="container">
        <div className="ArticleSectionTitle">
          <p className="text-light">{BLOG_TITLE}</p>
        </div>
        <div className="ArticleSectionIntroduction">
          <p className="text-light">{BLOG_SUBTITLE}</p>
        </div>
      </div>
    </div>
  )
}
