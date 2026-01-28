const express = require('express')
const jwt = require('jsonwebtoken')
const getDb = require('../lib/mongo')
const { ObjectId } = require('mongodb')
const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

function getTokenFromReq(req) {
  const auth = req.get('authorization')
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1]
  return null
}

router.post('/disease-info', async (req, res) => {
  try {
    const { icdCode, diseaseName } = req.body

    if (!diseaseName && !icdCode) {
      return res.status(400).json({ error: 'Disease name or ICD code is required' })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    
    const prompt = `You are a medical information system. Provide comprehensive, accurate medical information about the following disease in a structured format.

Disease: ${diseaseName || 'Unknown'}
ICD-11 Code: ${icdCode || 'Not provided'}

Please provide the following information in JSON format:
{
  "title": "Full medical name of the disease",
  "definition": "A concise 2-3 sentence definition of the disease",
  "longDefinition": "A detailed explanation of the disease (4-6 sentences)",
  "synonyms": ["alternative name 1", "alternative name 2", ...],
  "symptoms": ["symptom 1", "symptom 2", "symptom 3", ...],
  "causes": ["cause 1", "cause 2", ...],
  "riskFactors": ["risk factor 1", "risk factor 2", ...],
  "diagnosis": ["diagnostic method 1", "diagnostic method 2", ...],
  "treatment": ["treatment option 1", "treatment option 2", ...],
  "prevention": ["prevention method 1", "prevention method 2", ...],
  "prognosis": "Expected outcome and long-term outlook",
  "complications": ["complication 1", "complication 2", ...],
  "prevalence": "Information about how common the disease is",
  "clinicalNotes": ["important clinical note 1", "important clinical note 2", ...]
}

Provide accurate, evidence-based medical information. Be comprehensive but concise. Return ONLY the JSON object, no additional text.`

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.2,
          max_tokens: 2048,
          top_p: 0.95
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return res.status(response.status).json({ error: 'Failed to generate disease information' })
    }

    const data = await response.json()
    const generatedText = data.choices?.[0]?.message?.content || ''

    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = generatedText.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    try {
      const diseaseInfo = JSON.parse(jsonText)
      return res.json({ success: true, data: diseaseInfo })
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError)
      console.error('Response text:', generatedText)
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        rawResponse: generatedText
      })
    }

  } catch (err) {
    console.error('Groq API error:', err)
    return res.status(500).json({ error: 'Failed to generate disease information' })
  }
})

router.post('/research-papers', async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const SERPAPI_KEY = process.env.SERPAPI_KEY
    
    if (!SERPAPI_KEY) {
      return res.status(500).json({ error: 'SerpAPI key not configured' })
    }

    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&num=100`
    
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SerpAPI error:', errorText)
      return res.status(response.status).json({ error: 'Failed to fetch research papers' })
    }
    const data = await response.json()
    console.log(data);
    
    const papers = (data.organic_results || []).map(paper => ({
      title: paper.title,
      link: paper.link,
      snippet: paper.snippet,
      publication: paper.publication_info?.summary || '',
      citedBy: paper.inline_links?.cited_by?.total || 0,
      authors: paper.publication_info?.authors || [],
      year: paper.publication_info?.summary?.match(/\d{4}/) ? paper.publication_info.summary.match(/\d{4}/)[0] : ''
    }))

    return res.json({ success: true, papers })

  } catch (err) {
    console.error('Research papers API error:', err)
    return res.status(500).json({ error: 'Failed to fetch research papers' })
  }
})

// TODO: Add rate limiting middleware for production (e.g., express-rate-limit)
// Recommended: 10 requests per minute per user to prevent API abuse
router.post('/patient-chat', async (req, res) => {
  try {
    // Authentication
    const token = getTokenFromReq(req)
    if (!token) return res.status(401).json({ error: 'Missing authentication token' })
    
    let userData
    try {
      userData = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid authentication token' })
    }

    const { patientId, question } = req.body

    // Input validation
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' })
    }
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' })
    }

    if (question.trim().length > 1000) {
      return res.status(400).json({ error: 'Question is too long (max 1000 characters)' })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' })
    }

    // Fetch patient context
    const db = await getDb()
    if (!db) {
      return res.status(503).json({ error: 'Database unavailable' })
    }

    const patient = await db.collection('patients').findOne({ _id: new ObjectId(patientId) })
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    // Verify user has access to this patient (must be creator or diagnoser)
    const userId = userData.id || userData.email
    const isCreator = patient.createdBy === userId
    const hasDiagnosis = Array.isArray(patient.diagnosis) && 
                        patient.diagnosis.some(d => d.createdBy === userId)
    
    if (!isCreator && !hasDiagnosis) {
      return res.status(403).json({ error: 'Access denied to this patient' })
    }

    // Build patient context
    const patientAge = patient.age ? `${patient.age} years old` : 'age not specified'
    const diagnoses = Array.isArray(patient.diagnosis) && patient.diagnosis.length > 0
      ? patient.diagnosis.map(d => {
          const parts = []
          if (d.disease) parts.push(d.disease)
          if (d.icd11) parts.push(`(ICD-11: ${d.icd11})`)
          if (d.notes) parts.push(`- ${d.notes}`)
          return parts.join(' ')
        }).join('\n')
      : 'No diagnoses recorded'

    // Construct safety-first system prompt
    const systemPrompt = `You are HealthSync AI, a medical education assistant for healthcare professionals.

CRITICAL SAFETY CONSTRAINTS - YOU MUST NEVER:
- Diagnose any medical condition
- Prescribe medication, dosages, or treatment plans
- Provide emergency medical advice
- Suggest specific medical procedures
- Replace professional medical judgment

YOUR ROLE IS ONLY TO:
- Explain medical concepts in simple terms
- Summarize patient history information
- Provide general health education
- Answer questions about existing diagnoses
- Guide users to appropriate resources

PATIENT CONTEXT:
Age: ${patientAge}
Existing Diagnoses: ${diagnoses}

RESPONSE GUIDELINES:
1. If asked to diagnose: Refuse politely and advise consulting a doctor
2. If asked about prescriptions: Refuse and say only licensed providers can prescribe
3. If emergency situation described: Immediately advise calling emergency services
4. If uncertain: Say "I don't know" and advise consulting a healthcare professional
5. Keep responses clear, concise, and under 300 words
6. Always be empathetic and professional
7. Focus on education and explanation, not diagnosis or treatment

Remember: You are an educational tool, not a replacement for medical professionals.`

    const userPrompt = question.trim()

    // Call Groq API
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
          top_p: 0.9
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return res.status(response.status).json({ error: 'AI service temporarily unavailable' })
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    // Medical disclaimer
    const disclaimer = '⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.'

    return res.json({ 
      success: true,
      answer: answer.trim(),
      disclaimer
    })

  } catch (err) {
    console.error('Patient chat API error:', err)
    return res.status(500).json({ error: 'Failed to process chat request' })
  }
})

module.exports = router
