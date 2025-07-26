import express from 'express'
import { pool } from '../configs/db.js'
import { checkAuth } from '../middlewares/authenticate.js'

const router = express.Router()

// ?��??�?�唯一?��??��???router.get('/filters/types', async (req, res) => {
  try {
    const types = await pool.query(`
      SELECT DISTINCT event_type 
      FROM event_type 
      WHERE valid = 1 
      ORDER BY event_type ASC`)

    res.json({
      code: 200,
      message: 'success',
      data: types.rows.map((type) => type.event_type),
    })
  } catch (error) {
    console.error('Error fetching game types:', error)
    res.status(500).json({
      code: 500,
      message: '?��??�戲類�?失�?',
      error: error.message,
    })
  }
})

// ?��??�?�唯一?�平??router.get('/filters/platforms', async (req, res) => {
  try {
    const platforms = await pool.query(`
      SELECT DISTINCT event_platform 
      FROM event_type 
      WHERE valid = 1 
      ORDER BY event_platform ASC`)

    res.json({
      code: 200,
      message: 'success',
      data: platforms.rows.map((platform) => platform.event_platform),
    })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    res.status(500).json({
      code: 500,
      message: '?��?平台?�表失�?',
      error: error.message,
    })
  }
})

// ?��?活�??�表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      status = '',
      type = '',
      platform = '',
      teamType = '',
      keyword = '',
    } = req.query
    const offset = (page - 1) * pageSize

    let paramCount = 1
    const queryParams = []
    const countParams = []
    const conditions = []

    // ?��??�詢
    let query = `
      SELECT 
        et.*,
        (SELECT COUNT(*) 
         FROM event_registration er 
         WHERE er.event_id = et.event_id 
         AND er.registration_status = 'active'
         AND er.valid = 1
        ) as current_participants,
        CASE 
          WHEN NOW() < et.apply_start_time THEN '?��??��??��?'
          WHEN NOW() BETWEEN et.apply_start_time AND et.apply_end_time THEN '?��?�?
          WHEN NOW() BETWEEN et.apply_end_time AND et.event_end_time THEN '?��?�?
          ELSE '已�???
        END as event_status
      FROM event_type et
      WHERE et.valid = 1
    `

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM event_type et
      WHERE et.valid = 1
    `

    // ?�戲類�?篩選
    if (type && type !== '?�部?�戲' && type !== '?�部?�戲') {
      conditions.push(`et.event_type = $${paramCount}`)
      queryParams.push(type)
      countParams.push(type)
      paramCount++
    }

    // 平台篩選
    if (platform && platform !== '平台') {
      if (platform === 'Mobile') {
        conditions.push(
          `(et.event_platform ILIKE $${paramCount} OR et.event_platform ILIKE $${paramCount + 1})`
        )
        queryParams.push('Mobile%', '%Mobile%')
        countParams.push('Mobile%', '%Mobile%')
        paramCount += 2
      } else if (platform === 'PC') {
        conditions.push(
          `(et.event_platform ILIKE $${paramCount} OR et.event_platform ILIKE $${paramCount + 1})`
        )
        queryParams.push('PC%', '%PC%')
        countParams.push('PC%', '%PC%')
        paramCount += 2
      } else {
        conditions.push(`et.event_platform = $${paramCount}`)
        queryParams.push(platform)
        countParams.push(platform)
        paramCount++
      }
    }

    // ?�人/?��?篩選
    if (teamType && teamType !== '?�人/?��?') {
      let dbTeamType
      if (teamType === '?��?') {
        dbTeamType = '?��?'
      } else if (teamType === '?�人') {
        dbTeamType = '?�人'
      }

      if (dbTeamType) {
        conditions.push(`et.individual_or_team = $${paramCount}`)
        queryParams.push(dbTeamType)
        countParams.push(dbTeamType)
        paramCount++
      }
    }
    router.get('/user/registered', checkAuth, async (req, res) => {
      try {
        const userId = req.user.user_id

        const query = `
          SELECT 
            et.*,
            er.registration_status,
            er.registration_time,
            CASE 
              WHEN NOW() < et.apply_start_time THEN '?��??��??��?'
              WHEN NOW() BETWEEN et.apply_start_time AND et.apply_end_time THEN '?��?�?
              WHEN NOW() BETWEEN et.apply_end_time AND et.event_end_time THEN '?��?�?
              ELSE '已�???
            END as event_status
          FROM event_type et
          JOIN event_registration er ON et.event_id = er.event_id
          WHERE er.user_id = $1 
          AND er.registration_status = 'active'
          AND et.valid = 1
          ORDER BY er.registration_time DESC
        `

        const result = await pool.query(query, [userId])

        res.json({
          code: 200,
          message: 'success',
          data: {
            events: result.rows.map((event) => ({
              id: event.event_id,
              name: event.event_name,
              type: event.event_type,
              platform: event.event_platform,
              content: event.event_content,
              teamType: event.individual_or_team,
              picture: event.event_picture,
              applyStartTime: event.apply_start_time,
              applyEndTime: event.apply_end_time,
              eventStartTime: event.event_start_time,
              eventEndTime: event.event_end_time,
              status: event.event_status,
              registrationTime: event.registration_time,
            })),
          },
        })
      } catch (error) {
        console.error('?��??�戶活�?失�?:', error)
        res.status(500).json({
          code: 500,
          message: '?��??�戶活�?失�?',
          error: error.message,
        })
      }
    })

    // ?�鍵字�?�?    if (keyword && keyword.trim()) {
      conditions.push(`(
        et.event_name ILIKE $${paramCount} OR
        et.event_type ILIKE $${paramCount + 1} OR
        et.event_platform ILIKE $${paramCount + 2} OR
        et.event_content ILIKE $${paramCount + 3}
      )`)
      const searchTerm = `%${keyword.toLowerCase().trim()}%` // 確�?轉�??��?�?      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
      paramCount += 4
    }
    // ?�?�篩??    if (status) {
      const statusCondition = {
        ?��?�? 'NOW() BETWEEN et.apply_end_time AND et.event_end_time',
        ?��?�? 'NOW() BETWEEN et.apply_start_time AND et.apply_end_time',
        ?��??��??��?: 'NOW() < et.apply_start_time',
        已�??? 'NOW() > et.event_end_time',
      }[status]

      if (statusCondition) {
        conditions.push(statusCondition)
      }
    }

    // 組�??�?��?�?    if (conditions.length > 0) {
      const whereClause = conditions.join(' AND ')
      query += ` AND (${whereClause})`
      countQuery += ` AND (${whereClause})`
    }

    // 添�??��??��???    query += ` ORDER BY et.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    queryParams.push(parseInt(pageSize), offset)

    const events = await pool.query(query, queryParams)
    const totalRows = await pool.query(countQuery, countParams)

    res.json({
      code: 200,
      message: 'success',
      data: {
        events: events.rows.map((event) => ({
          id: event.event_id,
          name: event.event_name,
          type: event.event_type,
          platform: event.event_platform,
          content: event.event_content,
          rule: event.event_rule,
          award: event.event_award,
          teamType: event.individual_or_team,
          picture: event.event_picture,
          applyStartTime: event.apply_start_time,
          applyEndTime: event.apply_end_time,
          eventStartTime: event.event_start_time,
          eventEndTime: event.event_end_time,
          maxPeople: event.maximum_people,
          currentParticipants: parseInt(event.current_participants) || 0,
          status: event.event_status,
          createdAt: event.created_at,
        })),
        total: parseInt(totalRows.rows[0].total),
        currentPage: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({
      code: 500,
      message: '?��?活�?資�?失�?',
      error: error.message,
    })
  }
})

// ?��??��?活�?詳�?
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `
      SELECT 
        et.*,
        (SELECT COUNT(*) 
         FROM event_registration er 
         WHERE er.event_id = et.event_id 
         AND er.registration_status = 'active'
         AND er.valid = 1
        ) as current_participants,
        CASE 
          WHEN NOW() < et.apply_start_time THEN '?��??��??��?'
          WHEN NOW() BETWEEN et.apply_start_time AND et.apply_end_time THEN '?��?�?
          WHEN NOW() BETWEEN et.apply_end_time AND et.event_end_time THEN '?��?�?
          ELSE '已�???
        END as event_status
      FROM event_type et
      WHERE et.event_id = $1 AND et.valid = 1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '活�?不�???,
      })
    }

    const event = result.rows[0]
    res.json({
      code: 200,
      message: 'success',
      data: {
        id: event.event_id,
        name: event.event_name,
        type: event.event_type,
        platform: event.event_platform,
        content: event.event_content,
        rule: event.event_rule,
        award: event.event_award,
        teamType: event.individual_or_team,
        picture: event.event_picture,
        applyStartTime: event.apply_start_time,
        applyEndTime: event.apply_end_time,
        eventStartTime: event.event_start_time,
        eventEndTime: event.event_end_time,
        maxPeople: event.maximum_people,
        currentParticipants: parseInt(event.current_participants) || 0,
        status: event.event_status,
        createdAt: event.created_at,
      },
    })
  } catch (error) {
    console.error('Error fetching event details:', error)
    res.status(500).json({
      code: 500,
      message: '?��?活�?詳�?失�?',
      error: error.message,
    })
  }
})

// 註�??��?路由（個人?��??��?
router.post('/:eventId/register/:type', checkAuth, async (req, res) => {
  const client = await db.connect()
  try {
    const { eventId, type } = req.params
    const userId = req.user.user_id
    const { participantInfo, teamName, captainInfo, teamMembers } = req.body
    const isTeam = type === 'team'

    // 驗�?必�?資�?
    if (isTeam && (!teamName || !captainInfo || !teamMembers)) {
      return res.status(400).json({
        code: 400,
        message: '缺�?必�??�報?��?�?,
      })
    }

    await client.query('BEGIN')

    // 檢查活�??�否存在
    const eventResult = await client.query(
      'SELECT * FROM event_type WHERE event_id = $1 AND valid = 1',
      [eventId]
    )

    if (eventResult.rows.length === 0) {
      throw new Error('活�?不�???)
    }

    const event = eventResult.rows[0]
    const now = new Date()
    const applyStartTime = new Date(event.apply_start_time)
    const applyEndTime = new Date(event.apply_end_time)

    // ?�種檢查
    if (now < applyStartTime) throw new Error('?��??��?�?)
    if (now > applyEndTime) throw new Error('?��?已�???)

    // 檢查?��??�??    const registered = await client.query(
      'SELECT 1 FROM event_registration WHERE event_id = $1 AND user_id = $2 AND registration_status = $3 AND valid = 1',
      [eventId, userId, 'active']
    )

    if (registered.rows.length > 0) {
      throw new Error('?�已?��?此活??)
    }

    // ?��??��?資�?
    const regResult = await client.query(
      `INSERT INTO event_registration 
       (event_id, user_id, participant_info, registration_status, registration_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        eventId,
        userId,
        JSON.stringify(
          isTeam ? { teamName, captainInfo, teamMembers } : participantInfo
        ),
        'active',
        new Date(),
      ]
    )

    // ?�新?��?人數
    await client.query(
      `UPDATE event_type
       SET current_participants = (
         SELECT COUNT(*) FROM event_registration 
         WHERE event_id = $1 AND registration_status = 'active' AND valid = 1
       )
       WHERE event_id = $1`,
      [eventId]
    )

    await client.query('COMMIT')

    res.json({
      code: 200,
      message: '?��??��?',
      data: {
        registrationId: regResult.rows[0].id,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('?��?失�?:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '?��?失�?',
    })
  } finally {
    client.release()
  }
})

// ?��??��?
router.delete('/:eventId/registration', checkAuth, async (req, res) => {
  const client = await db.connect()
  try {
    const { eventId } = req.params
    const userId = req.user.user_id

    await client.query('BEGIN')

    const eventResult = await client.query(
      'SELECT * FROM event_type WHERE event_id = $1 AND valid = 1',
      [eventId]
    )

    if (eventResult.rows.length === 0) {
      throw new Error('活�?不�???)
    }

    const event = eventResult.rows[0]
    const now = new Date()
    const eventStartTime = new Date(event.event_start_time)

    if (now >= eventStartTime) {
      throw new Error('活�?已�?始�??��??��??��?')
    }

    const updateResult = await client.query(
      'UPDATE event_registration SET registration_status = $1 WHERE event_id = $2 AND user_id = $3 RETURNING *',
      ['cancelled', eventId, userId]
    )

    if (updateResult.rows.length === 0) {
      throw new Error('?��??�報?�此活�?')
    }

    await client.query(
      `UPDATE event_type 
       SET current_participants = (
         SELECT COUNT(*) FROM event_registration 
         WHERE event_id = $1 AND registration_status = 'active' AND valid = 1
       )
       WHERE event_id = $1`,
      [eventId]
    )

    await client.query('COMMIT')

    res.json({
      code: 200,
      message: '?��??��??��?',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('?��??��?失�?:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '?��??��?失�?',
    })
  } finally {
    client.release()
  }
})

export default router
