const appEnv = process.env.NODE_ENV || 'development'
const port = parseInt(process.env.PORT, 10) || 3334
const logLevel = process.env.LOG_LEVEL || (appEnv === 'test' ? 'fatal' : 'info')
const baseUrl = process.env.BASE_URL || `http://localhost${port ? `:${port}` : ''}`

module.exports = {
  hostname: process.env.HTTP_HOST || '0.0.0.0',
  port,
  baseUrl,
  apiPath: '', // Path to the API endpoints in this app (no ending slash)
  env: appEnv,
  isTest: appEnv === 'test',
  logLevel: logLevel,

  passportSession: {
    secret: 'I am a secret',
    maxAge: 300000 // 5 minutes to complete the auth flow (ms)
  },

  sanitySession: {
    userIdHashSalt: 'A secret string to hash the generated sanity User id with',
    expires: 31557600000 // One year (ms)
  },

  sanityClient: {
    projectId: 'xxx',
    dataset: 'production',
    token: process.env.SANITY_API_TOKEN || 'xxyyzz',
    useCdn: false
  },

  redis: getRedisConnectionDetails(process.env),
}


function getRedisConnectionDetails(env) {
  const sentinelMasterName = env.SENTINEL_MASTER_NAME
  const defaultPort = sentinelMasterName ? 26379 : 6379
  const hostConfig = {
    host: env.SANITY_AUTH_REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || defaultPort, 10)
  }

  const baseConfig = {
    password: env.REDIS_PASSWORD,
    maxReconnects: env.REDIS_MAX_RECONNECTS || 200,
    enableReadyCheck: false,
    prefix: 'sanity-auth-session:'
  }

  if (!sentinelMasterName) {
    return Object.assign({}, hostConfig, baseConfig)
  }

  const sentinelConfig = {
    sentinels: [hostConfig],
    name: sentinelMasterName
  }

  return Object.assign({}, baseConfig, sentinelConfig)
}