import React from 'react'
import dynamic from 'next/dynamic'

const CKEditor = dynamic(
  () => import('@ckeditor/ckeditor5-react').then((mod) => mod.CKEditor),
  { ssr: false }
)

const ClassicEditor = dynamic(
  () => import('@ckeditor/ckeditor5-build-classic'),
  { ssr: false }
)

class MyUploadAdapter {
  // ... (保持不變)
}

const Myeditor = ({ onChange, editorLoaded, name, value }) => {
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

  if (!editorLoaded) {
    return <div>編輯器載入中...</div>
  }

  return (
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
  )
}

// 確保在伺服器端不渲染
export default dynamic(() => Promise.resolve(Myeditor), { ssr: false })
