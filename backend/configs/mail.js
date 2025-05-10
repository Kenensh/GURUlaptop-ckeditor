// 導入dotenv 使用 .env 檔案中的設定值 process.env
import 'dotenv/config.js'
import nodemailer from 'nodemailer'
import colors from 'colors'

colors.enable()

// 定義所有email的寄送伺服器位置
const transport = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // 修正：port 587 應該用 secure: false
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false  // 避免某些 SSL 問題
  }
}

// 輸出環境變數狀態以便偵錯 (不顯示密碼)
console.log('SMTP 配置狀態：'.yellow)
console.log(`- GMAIL_USER: ${process.env.GMAIL_USER ? '已設置' : '未設置！'}`.yellow)
console.log(`- GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '已設置' : '未設置！'}`.yellow)

// 建立 nodemailer 運輸器
const transporter = nodemailer.createTransport(transport)

// 驗証連線設定
transporter.verify((error, success) => {
  if (error) {
    // 發生錯誤
    console.error(
      `WARN - 無法連線至SMTP伺服器 - ${error.message}`.bgYellow
    )
    console.error(`請確認您的 GMAIL_USER 和 GMAIL_APP_PASSWORD 環境變數已正確設置`.bgYellow)
  } else {
    // 代表成功
    console.log('INFO - SMTP伺服器已連線 SMTP server connected.'.bgGreen)
  }
})

export default transporter
