import React, { useState, useEffect } from 'react'

export default function BlogcreatedActionbuttons(props) {
  return (
    <>
      <div className="container d-flex flex-row justify-content-around align-items-center">
        <button className="BlogEditButtonSubmit" type="submit">
          送出
        </button>
        <button className="BlogEditButtonDelete" type="submit">
          刪除
        </button>
      </div>
    </>
  )
}
