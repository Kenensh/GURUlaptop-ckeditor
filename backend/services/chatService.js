import WebSocket from 'ws'
import { ChatRoom } from '../models/ChatRoom.js'
import { pool } from '../configs/db.js'

class ChatService {
  constructor() {
    this.clients = new Map()
    this.rooms = new Map()
    this.messageQueue = new Map()
  }

  // WebSocket 連接處理相關方法保持不變...
  handleConnection(ws, req) {
    // 保持原有的代碼不變...
  }

  async handleMessage(ws, data) {
    // 保持原有的代碼不變...
  }

  async handleRegisterUser(ws, data) {
    // 保持原有的代碼不變...
  }

  async handleChatMessage(ws, data) {
    const { roomID, message, fromID } = data

    try {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // 檢查是否為群組成員
        const memberCheck = await client.query(
          `SELECT gm.* 
           FROM group_members gm
           JOIN "group" g ON gm.group_id = g.group_id
           WHERE g.chat_room_id = $1 AND gm.member_id = $2 
           AND gm.status = 'accepted'`,
          [roomID, fromID]
        )

        if (memberCheck.rows.length === 0) {
          throw new Error('您不是該群組的成員')
        }

        // 儲存消息
        const result = await client.query(
          'INSERT INTO chat_messages (room_id, sender_id, message, is_private, is_system) VALUES ($1, $2, $3, false, false) RETURNING id',
          [roomID, fromID, message]
        )

        // 獲取發送者資訊
        const userData = await client.query(
          'SELECT name as sender_name, image_path as sender_image FROM users WHERE user_id = $1',
          [fromID]
        )

        await client.query('COMMIT')

        // 廣播消息給房間內的所有成員
        const messageData = {
          type: 'message',
          id: result.rows[0].id,
          room_id: roomID,
          sender_id: fromID,
          sender_name: userData.rows[0]?.sender_name || '未知用戶',
          sender_image: userData.rows[0]?.sender_image,
          message: message,
          created_at: new Date().toISOString(),
        }

        this.broadcastToRoom(roomID, messageData)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('處理群組訊息錯誤:', error)
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message || '發送訊息失敗',
        })
      )
    }
  }

  async handleGroupRequest(ws, { fromID, groupId, gameId, description }) {
    try {
      // 獲取申請者資訊
      const senderResult = await pool.query(
        'SELECT name, image_path FROM users WHERE user_id = $1',
        [fromID]
      )
      const sender = senderResult.rows[0]

      const group = await ChatRoom.getGroupById(groupId)
      if (!group) throw new Error('找不到該群組')

      // 通知群組創建者
      const creatorWs = this.clients.get(group.creator_id)
      if (creatorWs?.readyState === WebSocket.OPEN) {
        creatorWs.send(
          JSON.stringify({
            type: 'newGroupRequest',
            requestId: group.id,
            fromUser: fromID,
            senderName: sender.name,
            senderImage: sender.image_path,
            gameId,
            description,
            groupName: group.group_name,
            timestamp: new Date().toISOString(),
          })
        )
      }

      // 保存申請記錄
      const result = await pool.query(
        `INSERT INTO group_requests 
         (group_id, sender_id, creator_id, game_id, description) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [groupId, fromID, group.creator_id, gameId, description]
      )

      // 向申請者發送確認
      ws.send(
        JSON.stringify({
          type: 'groupRequestSent',
          success: true,
          requestId: result.rows[0].id,
          groupId,
          senderName: sender.name,
          senderImage: sender.image_path,
          timestamp: new Date().toISOString(),
        })
      )
    } catch (error) {
      console.error('處理群組申請錯誤:', error)
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message,
        })
      )
    }
  }

  async handleGroupRequestResponse(ws, { requestId, status, message }) {
    try {
      // 獲取申請詳情
      const requestResult = await pool.query(
        `SELECT gr.*, g.chat_room_id, g.group_name,
                u.name as sender_name, u.image_path as sender_image
         FROM group_requests gr
         JOIN "group" g ON gr.group_id = g.group_id
         JOIN users u ON gr.sender_id = u.user_id
         WHERE gr.id = $1`,
        [requestId]
      )

      const request = requestResult.rows[0]
      if (!request) throw new Error('找不到該申請')

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        await client.query(
          'UPDATE group_requests SET status = $1, updated_at = NOW() WHERE id = $2',
          [status, requestId]
        )

        if (status === 'accepted') {
          // 將申請者加入群組
          await client.query(
            'INSERT INTO group_members (group_id, member_id, status) VALUES ($1, $2, $3)',
            [request.group_id, request.sender_id, 'accepted']
          )

          if (request.chat_room_id) {
            // 將申請者加入聊天室
            await client.query(
              'INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2)',
              [request.chat_room_id, request.sender_id]
            )

            // 發送系統消息
            const systemMessage = JSON.stringify({
              type: 'system',
              content: `${request.sender_name} 已加入群組`,
            })

            await client.query(
              'INSERT INTO chat_messages (room_id, sender_id, message, is_system) VALUES ($1, $2, $3, true)',
              [request.chat_room_id, 0, systemMessage]
            )

            // 廣播系統消息
            this.broadcastToRoom(request.chat_room_id, {
              type: 'system',
              content: `${request.sender_name} 已加入群組`,
              created_at: new Date().toISOString(),
            })
          }
        }

        await client.query('COMMIT')

        // 通知申請者處理結果
        const applicantWs = this.clients.get(request.sender_id)
        if (applicantWs?.readyState === WebSocket.OPEN) {
          applicantWs.send(
            JSON.stringify({
              type: 'groupRequestResult',
              requestId,
              status,
              message:
                message ||
                (status === 'accepted'
                  ? '您的申請已被接受'
                  : '您的申請已被拒絕'),
              sender_name: request.sender_name,
              sender_image: request.sender_image,
              timestamp: new Date().toISOString(),
            })
          )
        }

        // 廣播群組更新
        this.broadcastToRoom(request.chat_room_id, {
          type: 'groupMemberUpdate',
          groupId: request.group_id,
          memberId: request.sender_id,
          status: status,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('處理群組申請回應錯誤:', error)
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message,
        })
      )
    }
  }

  async handleJoinRoom(ws, { roomID, fromID }) {
    try {
      const client = await pool.connect()
      try {
        const memberCheck = await client.query(
          `SELECT gm.* 
           FROM group_members gm
           JOIN "group" g ON gm.group_id = g.group_id
           WHERE g.chat_room_id = $1 AND gm.member_id = $2 
           AND gm.status = 'accepted'`,
          [roomID, fromID]
        )

        if (memberCheck.rows.length === 0) {
          throw new Error('您不是該群組的成員')
        }

        if (!this.rooms.has(roomID)) {
          this.rooms.set(roomID, new Set())
        }

        const room = this.rooms.get(roomID)
        room.add(ws)
        ws.roomID = roomID

        const groupInfo = await client.query(
          `SELECT 
            g.*, 
            COUNT(gm.member_id) as member_count
           FROM "group" g
           LEFT JOIN group_members gm ON g.group_id = gm.group_id
           WHERE g.chat_room_id = $1 AND gm.status = 'accepted'
           GROUP BY g.group_id`,
          [roomID]
        )

        const messages = await client.query(
          `SELECT 
            cm.*,
            u.name as sender_name,
            u.image_path as sender_image
           FROM chat_messages cm
           LEFT JOIN users u ON cm.sender_id = u.user_id
           WHERE cm.room_id = $1
           ORDER BY cm.created_at ASC
           LIMIT 50`,
          [roomID]
        )

        ws.send(
          JSON.stringify({
            type: 'roomJoined',
            roomId: roomID,
            groupInfo: {
              id: groupInfo.rows[0].group_id,
              name: groupInfo.rows[0].group_name,
              memberCount: groupInfo.rows[0].member_count,
              maxMembers: groupInfo.rows[0].max_members,
            },
            messages: messages.rows.map((msg) => ({
              id: msg.id,
              sender_id: msg.sender_id,
              sender_name: msg.sender_name || '未知用戶',
              sender_image: msg.sender_image,
              message: msg.message,
              created_at: msg.created_at,
              is_system: Boolean(msg.is_system),
            })),
            timestamp: new Date().toISOString(),
          })
        )

        this.broadcastToRoom(roomID, {
          type: 'memberJoined',
          userId: fromID,
          roomId: roomID,
          timestamp: new Date().toISOString(),
        })
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('加入房間錯誤:', error)
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message || '加入房間失敗',
        })
      )
    }
  }

  // handleLeaveRoom 和 handleDisconnection 方法保持不變...

  async sendSystemMessage(roomId, content) {
    const client = await pool.connect()
    try {
      const result = await client.query(
        'INSERT INTO chat_messages (room_id, sender_id, message, is_system) VALUES ($1, $2, $3, true) RETURNING id',
        [roomId, 0, content]
      )

      this.broadcastToRoom(roomId, {
        type: 'system',
        id: result.rows[0].id,
        content,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('發送系統訊息錯誤:', error)
    } finally {
      client.release()
    }
  }
}

export const chatService = new ChatService()
