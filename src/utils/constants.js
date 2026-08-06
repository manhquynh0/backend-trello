require('dotenv').config()
export const WHITELIST_DOMAINS = [
  'http://localhost:5173'
]
export const BOARD_TYPES = {
  PUBLIC : 'public',
  PRIVATE : 'private'
}
export const WEBSITE_DOMAIN = (process.env.BUILD_MODE === 'production') ? process.env.WEBSITE_DOMAIN_PRODUCTION : process.env.WEBSITE_DOMAIN_DEVELOPMENT