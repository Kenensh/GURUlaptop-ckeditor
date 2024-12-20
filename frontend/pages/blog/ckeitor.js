// pages/ckeditor.js
import { useState, useEffect } from 'react'
import Myeditor from '@/components/blog/Myeditor'

const YourComponent = () => {
  // 原本的 textarea value
  const [content, setContent] = useState('')
  // 控制編輯器載入
  const [editorLoaded, setEditorLoaded] = useState(false)

  useEffect(() => {
    setEditorLoaded(true)
  }, [])

  return (
    <div>
      <Myeditor
        name="content"
        onChange={(data) => {
          setContent(data)
        }}
        editorLoaded={editorLoaded}
        value={content}
      />

      <div>
        <h4>HTML Content:</h4>
        {content}
      </div>
    </div>
  )
}

// 加上這行
export default YourComponent
