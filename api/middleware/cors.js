// CORS middleware
const setupCors = (req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    req.headers.origin || 'http://localhost:5173',
  )
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  )
  res.header('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
}

module.exports = setupCors
