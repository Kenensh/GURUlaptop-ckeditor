import React from 'react'
import dynamic from 'next/dynamic'

// 使用單一的動態導入來避免版本不兼容問題
const Editor = dynamic(
  () => import("@ckeditor/ckeditor5-build-classic").then(mod => {
    const CKEditor = require("@ckeditor/ckeditor5-react").CKEditor;
    const ClassicEditor = mod.default;
    return {
      default: props => <CKEditor editor={ClassicEditor} {...props} />
    }
  }),
  {
    ssr: false,
    loading: () => <div>編輯器載入中...</div>
  }
)

class MyUploadAdapter {
  // ... (保持不變)
}

function MyCustomUploadAdapterPlugin(editor) {
  // ... (保持不變)
}

const EditMyeditor = ({ onChange, editorLoaded, name, value }) => {
  const editorConfig = {
    extraPlugins: [MyCustomUploadAdapterPlugin],
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

  return editorLoaded ? (
    <Editor
      data={value}
      config={editorConfig}
      onChange={(event, editor) => {
        const data = editor.getData()
        onChange(data)
      }}
    />
  ) : (
    <div>編輯器載入中...</div>
  )
}

export default EditMyeditor