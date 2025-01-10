import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiamond } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/use-auth'
import Header from '@/components/layout/default-layout/header'
import MyFooter from '@/components/layout/default-layout/my-footer'
import BlogDetailMainArea from '@/components/blog/bloghomepage/articlehomepage-mainarea'
import Link from 'next/link'
import { IoArrowBackCircleOutline } from 'react-icons/io5'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)
import Head from 'next/head'
import EditMyeditor from '@/components/blog/blogedit/EditMyeditor'

export default function BlogUserEdit() {
  const router = useRouter()
  const { blog_id } = router.query
  const { auth } = useAuth()
  const { isAuth, userData } = auth
  const [editorLoaded, setEditorLoaded] = useState(false)

  // 單獨的狀態管理，跟 blog-created.js 保持一致
  const [blog_type, setType] = useState('')
  const [blog_title, setTitle] = useState('')
  const [blog_content, setContent] = useState('')
  const [blog_brand, setBrand] = useState('')
  const [blog_brand_model, setBrandModel] = useState('')
  const [blog_keyword, setKeyword] = useState('')
  const [blog_valid_value, setValidvalue] = useState('1')
  const [blog_image, setImage] = useState(null)
  const [originalImage, setOriginalImage] = useState(null)

  // 品牌選項
  const brands = [
    ['ROG', 'DELL', 'Acer', 'Raser'],
    ['GIGABYTE', 'MSI', 'HP', 'ASUS'],
  ]

  useEffect(() => {
    setEditorLoaded(true)
  }, [])

  // 獲取現有部落格資料
  useEffect(() => {
    if (blog_id) {
      fetch(`http://localhost:3005/api/blog/blog-user-detail/${blog_id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'success') {
            setType(data.data.blog_type || '')
            setTitle(data.data.blog_title || '')
            setContent(data.data.blog_content || '')
            setBrand(data.data.blog_brand || '')
            setBrandModel(data.data.blog_brand_model || '')
            setKeyword(data.data.blog_keyword || '')
            setValidvalue(data.data.blog_valid_value || '1')
            setOriginalImage(data.data.blog_image)
          }
        })
        .catch((error) => {
          console.error('獲取部落格資料錯誤:', error)
          MySwal.fire({
            icon: 'error',
            title: '獲取部落格資料失敗',
            showConfirmButton: false,
            timer: 1500,
          })
        })
    }
  }, [blog_id])

  // 表單提交處理
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!blog_content.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: '請輸入內文',
        showConfirmButton: false,
        timer: 1500,
      })
      return
    }

    const formData = new FormData()
    formData.append('user_id', userData.user_id)
    formData.append('blog_type', blog_type)
    formData.append('blog_title', blog_title)
    formData.append('blog_content', blog_content)
    formData.append('blog_brand', blog_brand)
    formData.append('blog_brand_model', blog_brand_model)
    formData.append('blog_keyword', blog_keyword)
    formData.append('blog_valid_value', blog_valid_value)

    if (blog_image) {
      formData.append('blog_image', blog_image)
    }
    if (originalImage) {
      formData.append('originalImage', originalImage)
    }

    try {
      const response = await fetch(
        `http://localhost:3005/api/blog/blog-edit/${blog_id}`,
        {
          method: 'PUT',
          body: formData,
        }
      )
      console.log('API回應:', response.status)

      const result = await response.json()

      if (response.ok) {
        MySwal.fire({
          icon: 'success',
          title: '部落格修改成功',
          showConfirmButton: false,
          timer: 1500,
        })
        router.push('/blog')
      } else {
        MySwal.fire({
          icon: 'error',
          title: '部落格修改失敗',
          showConfirmButton: false,
          timer: 1500,
        })
      }
    } catch (error) {
      console.error('錯誤:', error)
      MySwal.fire({
        icon: 'error',
        title: '部落格修改失敗',
        showConfirmButton: false,
        timer: 1500,
      })
    }
  }

  return (
    <>
      <Head>
        <title>編輯部落格</title>
      </Head>
      <Header />
      <BlogDetailMainArea />
      <div className="container">
        <div className="mt-5 mb-5">
          <Link href="/dashboard" className="text-decoration-none fs-5">
            <p className="fs-5 fw-bold">
              <IoArrowBackCircleOutline /> 返回使用者總覽
            </p>
          </Link>
        </div>
      </div>

      <div className="container-lg container-fluid d-flex h-auto flex-column gap-5 mt-5 col-lg-5 col-md-8 col-12">
        <div className="">
          <div className="BlogEditSmallTitle text-nowrap">
            <p>
              <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
              {'\u00A0 '}
              {'\u00A0 '}
              新增封面圖片
            </p>
          </div>
        </div>

        <div
          className="BlogImgUploadDiv"
          onClick={() => document.getElementById('imageInput').click()}
        >
          {blog_image || originalImage ? (
            <img
              src={
                blog_image instanceof File
                  ? URL.createObjectURL(blog_image)
                  : `http://localhost:3005${originalImage}`
              }
              alt="預覽圖片"
              className="object-fit-cover w-100 h-100"
            />
          ) : (
            <>
              <i className="fa-solid fa-arrow-up-from-bracket" />
              <div style={{ cursor: 'pointer' }}></div>
            </>
          )}
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ display: 'none' }}
            id="imageInput"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="container-fluid d-flex flex-lg-row flex-column align-items-start justify-content-start">
            <div className="BlogEditSmallTitle text-nowrap col-lg-2 col-12">
              <p>
                <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
                {'\u00A0 '}
                {'\u00A0 '}
                標題
              </p>
            </div>
            <div className="col-lg-10 col-11">
              <input
                className="blog-form-control blog-form-control-lg"
                type="text"
                placeholder="標題"
                value={blog_title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="container-lg container-fluid-md  d-flex flex-lg-row flex-column  align-items-start justify-content-start mb-5 mt-5">
            <div className="BlogEditSmallTitle text-nowrap col-2">
              <p>
                <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
                {'\u00A0 '}
                {'\u00A0 '}
                內文
              </p>
            </div>
            <div className="col-10">
              <EditMyeditor
                name="content"
                onChange={(data) => setContent(data)}
                editorLoaded={editorLoaded}
                value={blog_content}
              />
            </div>
          </div>

          <div className="container-lg container-fluid  flex-lg-row flex-column justify-content-between align-items-start mb-5 gap-xxl-5 gap-xl-5 gap-lg-4 gap-md-3 gap-sm-2 gap-xs-2 gap-1">
            <div className="BlogSmallTitleAlign d-flex justify-content-start align-items-start">
              <div className="BlogEditSmallTitle text-nowrap">
                <p>
                  <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
                  {'\u00A0 '}
                  {'\u00A0 '}
                  筆電品牌
                </p>
              </div>
            </div>
            <div className="container-lg container-fluid d-flex flex-row justify-content-center mb-5 mt-5 gap-xxl-5 gap-xl-5 gap-lg-4 gap-md-3 gap-sm-2 gap-xs-2 gap-1">
              {brands.map((column, columnIndex) => (
                <div
                  key={columnIndex}
                  className="d-flex flex-column gap-xxl-5  gap-xl-5 gap-lg-4 gap-md-3 gap-sm-2 gap-xs-2 gap-1"
                >
                  {column.map((brand) => (
                    <div
                      key={brand}
                      className={`BlogEditBrandSelected shadow d-flex justify-content-center align-items-center ${
                        brand === blog_brand
                          ? 'BlogEditBrandSelectedActive'
                          : ''
                      }`}
                      onClick={() => setBrand(brand)}
                    >
                      <p className="m-0">{brand}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="container d-flex flex-lg-row flex-column align-items-start justify-content-start mt-5 mb-5">
            <div className="BlogEditSmallTitle text-nowrap col-2">
              <p>
                <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
                {'\u00A0 '}
                {'\u00A0 '}
                筆電型號
              </p>
            </div>
            <div className="col-10">
              <input
                className="blog-form-control blog-form-control-lg"
                type="text"
                placeholder="型號"
                value={blog_brand_model}
                onChange={(e) => setBrandModel(e.target.value)}
              />
            </div>
          </div>

          <div className="container d-flex justify-content-start align-items-start mb-5 flex-lg-row flex-column col-12">
            <div className="BlogEditSmallTitle text-nowrap col-10">
              <p>
                <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
                {'\u00A0 '}
                {'\u00A0 '}
                類別
              </p>
            </div>

            <div className="d-flex flex-column  gap-xxl-4 gap-xl-4 gap-lg-3 gap-md-2 gap-sm-1 gap-xs-1 gap-1 col-4 w-50 ms-5">
              {['購買心得', '開箱文', '疑難雜症', '活動心得'].map((v) => (
                <div
                  key={v}
                  className={`BlogEditBrandSelected shadow d-flex justify-content-center align-items-center ${
                    v === blog_type ? 'BlogEditBrandSelectedActive' : ''
                  }`}
                  onClick={() => setType(v)}
                >
                  <p>{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="d-flex align-items-start justify-content-start flex-md-row flex-column">
            <div className="BlogEditSmallTitle text-nowrap col-1">
              <p>
                <FontAwesomeIcon icon={faDiamond} className="TitleDiamond" />
                {'\u00A0 '}
                {'\u00A0 '}
                關鍵字
              </p>
            </div>
            <div className="col-9 col-lg-8 col-md-10">
              <input
                className="blog-form-control blog-form-control-lg"
                type="text"
                placeholder="輸入一組你喜歡的關鍵字！"
                value={blog_keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex flex-row justify-content-around align-items-center mt-5 mb-5">
            <button className="BlogEditButtonSubmit shadow" type="submit">
              送出
            </button>
            <button
              className="BlogEditButtonDelete shadow "
              type="button"
              onClick={async () => {
                const result = await MySwal.fire({
                  icon: 'warning',
                  title: '確定要刪除部落格嗎？',
                  text: '刪除後將無法復原！',
                  showCancelButton: true,
                  confirmButtonText: '確定刪除',
                  cancelButtonText: '取消',
                  confirmButtonColor: '#d33',
                  cancelButtonColor: '#3085d6',
                })

                if (result.isConfirmed) {
                  try {
                    const res = await fetch(
                      `http://localhost:3005/api/blog/blog-delete/${blog_id}`,
                      {
                        method: 'PUT',
                      }
                    )

                    if (res.ok) {
                      await MySwal.fire({
                        icon: 'success',
                        title: '刪除成功！',
                        showConfirmButton: false,
                        timer: 1500,
                      })

                      router.push('/blog/blog-delete-success')
                    }
                  } catch (error) {
                    console.error('刪除失敗:', error)
                    MySwal.fire({
                      icon: 'error',
                      title: '刪除失敗',
                      text: '請稍後再試',
                      showConfirmButton: true,
                    })
                  }
                }
              }}
            >
              刪除
            </button>
          </div>
        </form>
      </div>
      <MyFooter />
    </>
  )
}

BlogUserEdit.getLayout = (page) => page
