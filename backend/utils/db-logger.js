/**
 * 資料庫 Logger 工具
 * 為資料庫查詢添加詳細的日誌記錄
 */

import { logDbQuery, logError } from '#utils/logger.js'

/**
 * 包裝資料庫連接池，添加 Logger 功能
 */
export class DatabaseLogger {
  constructor(pool) {
    this.pool = pool
  }

  /**
   * 執行查詢並記錄日誌
   */
  async query(queryConfig, requestId) {
    const startTime = Date.now()
    
    try {
      // 記錄查詢開始
      logDbQuery(
        queryConfig.text || queryConfig, 
        queryConfig.values || [], 
        requestId, 
        'START'
      )
      
      // 執行查詢
      const result = await this.pool.query(queryConfig)
      
      // 記錄查詢成功
      const duration = Date.now() - startTime
      logDbQuery(
        queryConfig.text || queryConfig, 
        queryConfig.values || [], 
        requestId, 
        `SUCCESS (${duration}ms, ${result.rows.length} rows)`
      )
      
      return result
      
    } catch (error) {
      // 記錄查詢錯誤
      const duration = Date.now() - startTime
      logError(error, {
        query: queryConfig.text || queryConfig,
        params: queryConfig.values || [],
        duration: `${duration}ms`
      }, requestId)
      
      throw error
    }
  }

  /**
   * 開始事務
   */
  async begin(requestId) {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      logDbQuery('BEGIN', [], requestId, 'TRANSACTION')
      
      // 返回包裝後的客戶端
      return new TransactionLogger(client, requestId)
      
    } catch (error) {
      client.release()
      logError(error, { operation: 'BEGIN TRANSACTION' }, requestId)
      throw error
    }
  }
}

/**
 * 事務 Logger 類別
 */
class TransactionLogger {
  constructor(client, requestId) {
    this.client = client
    this.requestId = requestId
  }

  async query(queryConfig) {
    const startTime = Date.now()
    
    try {
      logDbQuery(
        queryConfig.text || queryConfig, 
        queryConfig.values || [], 
        this.requestId, 
        'TRANSACTION_QUERY'
      )
      
      const result = await this.client.query(queryConfig)
      
      const duration = Date.now() - startTime
      logDbQuery(
        queryConfig.text || queryConfig, 
        queryConfig.values || [], 
        this.requestId, 
        `TRANSACTION_SUCCESS (${duration}ms, ${result.rows.length} rows)`
      )
      
      return result
      
    } catch (error) {
      const duration = Date.now() - startTime
      logError(error, {
        query: queryConfig.text || queryConfig,
        params: queryConfig.values || [],
        duration: `${duration}ms`,
        operation: 'TRANSACTION_QUERY'
      }, this.requestId)
      
      throw error
    }
  }

  async commit() {
    try {
      await this.client.query('COMMIT')
      logDbQuery('COMMIT', [], this.requestId, 'TRANSACTION')
    } catch (error) {
      logError(error, { operation: 'COMMIT TRANSACTION' }, this.requestId)
      throw error
    } finally {
      this.client.release()
    }
  }

  async rollback() {
    try {
      await this.client.query('ROLLBACK')
      logDbQuery('ROLLBACK', [], this.requestId, 'TRANSACTION')
    } catch (error) {
      logError(error, { operation: 'ROLLBACK TRANSACTION' }, this.requestId)
    } finally {
      this.client.release()
    }
  }

  release() {
    this.client.release()
  }
}
