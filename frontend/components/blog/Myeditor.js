// components/blog/myeditor.js
import React, { useEffect, useRef } from 'react'

class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader
  }

  async upload() {
    try {
      const file = await this.loader.file
      const formData = new FormData()
      formData.append('articleImage', file)

      const response = await fetch(
        'http://localhost:3005/api/blog/upload-image',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return { default: `http://localhost:3005${data.url}` }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  abort() {
    // Abort upload implementation
  }
}

function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader)
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
          onError={(error, { willEditorRestart }) => {
            if (willEditorRestart) {
              console.error('編輯器將重新啟動:', error)
            }
          }}
        />
      ) : (
        <div>編輯器載入中...</div>
      )}
    </>
  )
}

export default Myeditor
