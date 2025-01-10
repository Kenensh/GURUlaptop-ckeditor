// components/blog/myeditor.js
import React, { useEffect, useRef } from 'react'

class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader
  }

  async upload() {
    try {
      const file = await this.loader.file

      // 檢查檔案格式
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只允許上傳 JPG, PNG, GIF, WebP 格式的圖片')
      }

      const formData = new FormData()
      formData.append('upload', file)  // 改為 'upload'

      const response = await fetch(
        'http://localhost:3005/api/blog/upload-blog-image',  // 新的上傳路徑
        {
          method: 'POST',
          body: formData,
        }
      )

      console.log('Response status:', response.status)
      
      const data = await response.json()

      // 根據新的回應格式處理
      if (data.uploaded) {
        return {
          default: `http://localhost:3005${data.url}`
        }
      } else {
        throw new Error(data.error?.message || '上傳失敗')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  abort() {
    // Abort upload implementation
  }
}

const Myeditor = ({ onChange, editorLoaded, name, value }) => {
  const editorRef = useRef()
  const { CKEditor, ClassicEditor } = editorRef.current || {}

  useEffect(() => {
    editorRef.current = {
      CKEditor: require('@ckeditor/ckeditor5-react').CKEditor,
      ClassicEditor: require('@ckeditor/ckeditor5-build-classic'),
    }
  }, [])

  const editorConfig = {
    extraPlugins: [
      function (editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = function (
          loader
        ) {
          return new MyUploadAdapter(loader)
        }
      },
    ],
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'imageUpload',
      'blockQuote',
      'insertTable',
      'undo',
      'redo',
    ],
    image: {
      toolbar: [
        'imageTextAlternative',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
      ],
    },
    language: 'zh',
  }

  return (
    <>
      {editorLoaded ? (
        <CKEditor
          name={name}
          editor={ClassicEditor}
          data={value}
          config={editorConfig}
          onChange={(event, editor) => {
            const data = editor.getData()
            onChange(data)
          }}
        />
      ) : (
        <div>編輯器載入中...</div>
      )}
    </>
  )
}

export default Myeditor
