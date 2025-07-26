import express from 'express'
import { pool } from '../configs/db.js'
import { checkAuth } from '../middlewares/authenticate.js'

const router = express.Router()

// ?≤Â??Ä?âÂîØ‰∏Ä?ÑÈ??≤È???router.get('/filters/types', async (req, res) => {
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
      message: '?≤Â??äÊà≤È°ûÂ?Â§±Ê?',
      error: error.message,
    })
  }
})

// ?≤Â??Ä?âÂîØ‰∏Ä?ÑÂπ≥??router.get('/filters/platforms', async (req, res) => {
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
      message: '?≤Â?Âπ≥Âè∞?óË°®Â§±Ê?',
      error: error.message,
    })
  }
})

// ?≤Â?Ê¥ªÂ??óË°®
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

    // ?∫Á??•Ë©¢
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
          WHEN NOW() < et.apply_start_time THEN '?≥Â??ãÂ??±Â?'
          WHEN NOW() BETWEEN et.apply_start_time AND et.apply_end_time THEN '?±Â?‰∏?
          WHEN NOW() BETWEEN et.apply_end_time AND et.event_end_time THEN '?≤Ë?‰∏?
          ELSE 'Â∑≤Á???
        END as event_status
      FROM event_type et
      WHERE et.valid = 1
    `

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM event_type et
      WHERE et.valid = 1
    `

    // ?äÊà≤È°ûÂ?ÁØ©ÈÅ∏
    if (type && type !== '?®ÈÉ®?äÊà≤' && type !== '?®ÈÉ®?äÊà≤') {
      conditions.push(`et.event_type = $${paramCount}`)
      queryParams.push(type)
      countParams.push(type)
      paramCount++
    }

    // Âπ≥Âè∞ÁØ©ÈÅ∏
    if (platform && platform !== 'Âπ≥Âè∞') {
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

    // ?ã‰∫∫/?òÈ?ÁØ©ÈÅ∏
    if (teamType && teamType !== '?ã‰∫∫/?òÈ?') {
      let dbTeamType
      if (teamType === '?òÈ?') {
        dbTeamType = '?òÈ?'
      } else if (teamType === '?ã‰∫∫') {
        dbTeamType = '?ã‰∫∫'
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
              WHEN NOW() < et.apply_start_time THEN '?≥Â??ãÂ??±Â?'
              WHEN NOW() BETWEEN et.apply_start_time AND et.apply_end_time THEN '?±Â?‰∏?
              WHEN NOW() BETWEEN et.apply_end_time AND et.event_end_time THEN '?≤Ë?‰∏?
              ELSE 'Â∑≤Á???
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
        console.error('?≤Â??®Êà∂Ê¥ªÂ?Â§±Ê?:', error)
        res.status(500).json({
          code: 500,
          message: '?≤Â??®Êà∂Ê¥ªÂ?Â§±Ê?',
          error: error.message,
        })
      }
    })

    // ?úÈçµÂ≠óÊ?Â∞?    if (keyword && keyword.trim()) {
      conditions.push(`(
        et.event_name ILIKE $${paramCount} OR
        et.event_type ILIKE $${paramCount + 1} OR
        et.event_platform ILIKE $${paramCount + 2} OR
        et.event_content ILIKE $${paramCount + 3}
      )`)
      const searchTerm = `%${keyword.toLowerCase().trim()}%` // Á¢∫‰?ËΩâÊ??∫Â?ÂØ?      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
      paramCount += 4
    }
    // ?Ä?ãÁØ©??    if (status) {
      const statusCondition = {
        ?≤Ë?‰∏? 'NOW() BETWEEN et.apply_end_time AND et.event_end_time',
        ?±Â?‰∏? 'NOW() BETWEEN et.apply_start_time AND et.apply_end_time',
        ?≥Â??ãÂ??±Â?: 'NOW() < et.apply_start_time',
        Â∑≤Á??? 'NOW() > et.event_end_time',
      }[status]

      if (statusCondition) {
        conditions.push(statusCondition)
      }
    }

    // ÁµÑÂ??Ä?âÊ?‰ª?    if (conditions.length > 0) {
      const whereClause = conditions.join(' AND ')
      query += ` AND (${whereClause})`
      countQuery += ` AND (${whereClause})`
    }

    // Ê∑ªÂ??íÂ??åÂ???    query += ` ORDER BY et.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
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
      message: '?≤Â?Ê¥ªÂ?Ë≥áÊ?Â§±Ê?',
      error: error.message,
    })
  }
})

// ?≤Â??Æ‰?Ê¥ªÂ?Ë©≥Ê?
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
          WHEN NOW() < et.apply_start_time THEN '?≥Â??ãÂ??±Â?'
          WHEN NOW() BETWEEN et.apply_start_time AND et.apply_end_time THEN '?±Â?‰∏?
          WHEN NOW() BETWEEN et.apply_end_time AND et.event_end_time THEN '?≤Ë?‰∏?
          ELSE 'Â∑≤Á???
        END as event_status
      FROM event_type et
      WHERE et.event_id = $1 AND et.valid = 1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: 'Ê¥ªÂ?‰∏çÂ???,
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
      message: '?≤Â?Ê¥ªÂ?Ë©≥Ê?Â§±Ê?',
      error: error.message,
    })
  }
})

// Ë®ªÂ??∏È?Ë∑ØÁî±ÔºàÂÄã‰∫∫?åÂ??äÔ?
router.post('/:eventId/register/:type', checkAuth, async (req, res) => {
  const client = await db.connect()
  try {
    const { eventId, type } = req.params
    const userId = req.user.user_id
    const { participantInfo, teamName, captainInfo, teamMembers } = req.body
    const isTeam = type === 'team'

    // È©óË?ÂøÖË?Ë≥áÊ?
    if (isTeam && (!teamName || !captainInfo || !teamMembers)) {
      return res.status(400).json({
        code: 400,
        message: 'Áº∫Â?ÂøÖË??ÑÂ†±?çË?Ë®?,
      })
    }

    await client.query('BEGIN')

    // Ê™¢Êü•Ê¥ªÂ??ØÂê¶Â≠òÂú®
    const eventResult = await client.query(
      'SELECT * FROM event_type WHERE event_id = $1 AND valid = 1',
      [eventId]
    )

    if (eventResult.rows.length === 0) {
      throw new Error('Ê¥ªÂ?‰∏çÂ???)
    }

    const event = eventResult.rows[0]
    const now = new Date()
    const applyStartTime = new Date(event.apply_start_time)
    const applyEndTime = new Date(event.apply_end_time)

    // ?ÑÁ®ÆÊ™¢Êü•
    if (now < applyStartTime) throw new Error('?±Â??™È?Âß?)
    if (now > applyEndTime) throw new Error('?±Â?Â∑≤Á???)

    // Ê™¢Êü•?±Â??Ä??    const registered = await client.query(
      'SELECT 1 FROM event_registration WHERE event_id = $1 AND user_id = $2 AND registration_status = $3 AND valid = 1',
      [eventId, userId, 'active']
    )

    if (registered.rows.length > 0) {
      throw new Error('?®Â∑≤?±Â?Ê≠§Ê¥ª??)
    }

    // ?∞Â??±Â?Ë≥áË?
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

    // ?¥Êñ∞?ÉË?‰∫∫Êï∏
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
      message: '?±Â??êÂ?',
      data: {
        registrationId: regResult.rows[0].id,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('?±Â?Â§±Ê?:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '?±Â?Â§±Ê?',
    })
  } finally {
    client.release()
  }
})

// ?ñÊ??±Â?
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
      throw new Error('Ê¥ªÂ?‰∏çÂ???)
    }

    const event = eventResult.rows[0]
    const now = new Date()
    const eventStartTime = new Date(event.event_start_time)

    if (now >= eventStartTime) {
      throw new Error('Ê¥ªÂ?Â∑≤È?ÂßãÔ??°Ê??ñÊ??±Â?')
    }

    const updateResult = await client.query(
      'UPDATE event_registration SET registration_status = $1 WHERE event_id = $2 AND user_id = $3 RETURNING *',
      ['cancelled', eventId, userId]
    )

    if (updateResult.rows.length === 0) {
      throw new Error('?®Â??™Â†±?çÊ≠§Ê¥ªÂ?')
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
      message: '?ñÊ??±Â??êÂ?',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('?ñÊ??±Â?Â§±Ê?:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '?ñÊ??±Â?Â§±Ê?',
    })
  } finally {
    client.release()
  }
})

export default router
