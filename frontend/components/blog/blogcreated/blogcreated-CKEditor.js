import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default function BlogcreatedCKEditor(props) {
  const [editorData, setEditorData] = useState("");

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setEditorData(data);
  };

  const getFormattedTimestamp = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace("T", " ");
  };

  const handleImageInsert = () => {
    const timestamp = getFormattedTimestamp();

    // 記得加入圖片喔
    // 記得加入圖片喔
    // 記得加入圖片喔
    // 記得加入圖片喔
    const imageHtml = `<img src="your-image-url.jpg" alt="Your Alt Text" data-timestamp="${timestamp}" />`;
    setEditorData((prevData) => prevData + imageHtml);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(editorData);
  };

  return (
    <>
      <CKEditor
        editor={ClassicEditor}
        data={editorData}
        onChange={handleEditorChange}
      />
    </>
  );
}
