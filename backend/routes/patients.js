const express = require('express')
const jwt = require('jsonwebtoken')
const getDb = require('../lib/mongo')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

function getTokenFromReq(req) {
  const auth = req.get('authorization')
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1]
  return null
}

router.post('/', async (req, res) => {
  try {
    const token = getTokenFromReq(req)
    if (!token) return res.status(401).json({ error: 'missing token' })

    let data
    try {
      data = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' })
    }

    const body = req.body || {}
    const { name, age, icd11 } = body
    if (!name || !age || !icd11) return res.status(400).json({ error: 'name, age and icd11 required' })

    const db = await getDb()
    if (!db) return res.status(503).json({ error: 'database unavailable' })

    const patients = db.collection('patients')
    const doc = { name, age: Number(age), icd11, createdBy: data.id || data.email || null, createdAt: new Date() }
    const r = await patients.insertOne(doc)
    return res.status(201).json({ id: String(r.insertedId), ...doc })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('patients POST error', err)
    return res.status(500).json({ error: 'failed to create patient' })
  }
})

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    if (!db) return res.status(503).json({ patients: [] })

    const docs = await db.collection('patients').find().sort({ createdAt: -1 }).limit(50).toArray()
    const patients = docs.map(d => ({ id: String(d._id), name: d.name, age: d.age, icd11: d.icd11, createdAt: d.createdAt, createdBy: d.createdBy }))
    return res.json({ patients })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('patients GET error', err)
    return res.status(500).json({ error: 'failed to fetch patients' })
  }
})

module.exports = router
