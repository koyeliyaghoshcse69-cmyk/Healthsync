const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { findByEmail, findById, createUser } = require('../lib/userStore')
const getDb = require('../lib/mongo')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    console.log(process.env.MONGODB_URI);
    const found = await findByEmail(email)
    if (!found) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, found.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(found)
    return res.json({ token, user: { id: found.id, email: found.email, role: found.role, profile: found.profile } })
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'login failed' })
  }
})

router.post('/signup', async (req, res) => {
  try {
    const body = req.body || {}
    const { email, password, role = 'doctor', profile = {} } = body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const existing = await findByEmail(email)
    if (existing) return res.status(409).json({ error: 'user already exists' })

    const user = await createUser({ email, password, role, profile })

    if (role === 'organization') {
      try {
        const db = await getDb()
        const orgName = profile?.organization || profile?.name || ''
        if (db && orgName) {
          const organizations = db.collection('organizations')
          const slug = String(orgName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const orgRes = await organizations.insertOne({ name: orgName, slug, admin: user.id, createdAt: new Date() })

          try {
            const usersCol = db.collection('users')
            let filter = { id: user.id }
            try { filter = { _id: new (require('mongodb').ObjectId)(user.id) } } catch (e) { filter = { id: user.id } }
            await usersCol.updateOne(filter, { $set: { 'profile.organizationId': String(orgRes.insertedId) } })
            user.profile = { ...(user.profile || {}), organizationId: String(orgRes.insertedId) }
          } catch (e) {
            console.warn('failed to link user to organization', e)
          }
        }
      } catch (e) {
        console.warn('organization save skipped', e)
      }
    }

    const token = signToken(user)
    return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } })
  } catch (err) {
    console.error('signup error', err)
    return res.status(500).json({ error: 'signup failed' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const auth = req.get('authorization')
    let token = null
    if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'missing token' })

    let data
    try {
      data = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' })
    }

    let user = await findById(data.id)
    if (!user && data.email) user = await findByEmail(data.email)
    if (!user) return res.status(404).json({ error: 'user not found' })

    return res.json({ user: { id: user.id, email: user.email, role: user.role, profile: user.profile } })
  } catch (err) {
    console.error('me error', err)
    return res.status(500).json({ error: 'failed to load user' })
  }
})

router.post('/logout', async (req, res) => {
  // no-op for token-based logout; return ok
  return res.json({ ok: true })
})

module.exports = router
