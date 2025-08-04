// configs/db.js
import pkg from 'pg'
import { Sequelize } from 'sequelize'
import UserModel from '../models/user.js'

const { Pool } = pkg

// 資料庫配置
const DB_CONFIG = {
  database: 'project_db_qbv8',
  user: 'project_db_qbv8_user',
  password: 'jtzyHNUWEo1n9Mxp4tvshZ54kH7QBuas',
  host: 'dpg-ctjcfrtsvqrc7387r9og-a.singapore-postgres.render.com',
  connectionString:
    'postgresql://project_db_qbv8_user:jtzyHNUWEo1n9Mxp4tvshZ54kH7QBuas@dpg-ctjcfrtsvqrc7387r9og-a.singapore-postgres.render.com/project_db_qbv8',
}

// 建立 Sequelize 實例
const sequelize = new Sequelize(
  DB_CONFIG.database,
  DB_CONFIG.user,
  DB_CONFIG.password,
  {
    host: DB_CONFIG.host,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+08:00', // 設定時區
  }
)

// 建立 Pool 實例
const pool = new Pool({
  connectionString: DB_CONFIG.connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10, // 減少最大連線數
  min: 2,  // 設置最小連線數
  idleTimeoutMillis: 20000, // 減少閒置超時
  connectionTimeoutMillis: 10000, // 添加連接超時
})

// 監聽 Pool 事件
pool.on('connect', () => {
  console.log('Database pool client connected')
})

pool.on('error', (err) => {
  console.error('Database pool error:', err)
})

// 初始化模型
console.log('Initializing database models...')
const User = UserModel(sequelize)
sequelize.models.User = User
console.log('Database models initialized successfully')

// 資料庫連線測試
const testConnection = async () => {
  console.log('Starting database connection test...')
  try {
    // 測試 Sequelize 連線
    console.log('Testing Sequelize connection...')
    await sequelize.authenticate()
    console.log('✅ Sequelize connection successful')

    // 測試 Pool 連線
    console.log('Testing Pool connection...')
    const client = await pool.connect()
    client.release()
    console.log('✅ Pool connection successful')

    return true
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    return false
  }
}

// 清理資源函數
const cleanup = async () => {
  console.log('Starting database cleanup...')
  try {
    await Promise.all([pool.end(), sequelize.close()])
    console.log('✅ Database connections closed successfully')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// 程式結束處理
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Cleaning up...')
  await cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Cleaning up...')
  await cleanup()
  process.exit(0)
})

// 未捕獲的 Promise 異常處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

// 執行連線測試
console.log('Executing database connection test...')
testConnection().then(success => {
  if (success) {
    console.log('🎉 Database initialization completed successfully')
  } else {
    console.log('⚠️ Database connection test failed, but continuing...')
  }
}).catch(error => {
  console.error('❌ Database test execution failed:', error)
})

console.log('Database module export ready')

// 匯出需要的模組
export { pool, sequelize as default, User, testConnection, cleanup }
