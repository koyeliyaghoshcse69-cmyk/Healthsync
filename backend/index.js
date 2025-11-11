const path = require('path')
// load local .env for development
try {
  // prefer backend/.env
  require('dotenv').config({ path: path.join(__dirname, '.env') })
} catch (e) {
  // ignore if dotenv is not installed or no .env present
}

const express = require('express')
const cors = require('cors')

const authRouter = require('./routes/auth')
const orgRouter = require('./routes/organizations')
const icdRouter = require('./routes/icd11')
const patientsRouter = require('./routes/patients')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.use('/api/auth', authRouter)
app.use('/api/organizations', orgRouter)
app.use('/api/icd11', icdRouter)
app.use('/api/patients', patientsRouter)

app.get('/health', (req, res) => res.json({ ok: true }))

// Export the app for serverless wrappers (Vercel functions) and also allow
// starting a standalone server when run directly (node index.js)
module.exports = app
if (process.env.NODE_ENV === 'development') {
  try { require('dotenv').config({ path: require('path').join(__dirname, '.env') }) } catch (e) {}
}
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`HealthSync backend listening on port ${PORT}`)
  })
}
