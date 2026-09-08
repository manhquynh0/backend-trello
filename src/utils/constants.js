require('dotenv').config()
export const WHITELIST_DOMAINS = [
  'http://localhost:5173',
  'http://manhquynhdz.com'

]
export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}
export const WEBSITE_DOMAIN = (process.env.BUILD_MODE === 'production') ? process.env.WEBSITE_DOMAIN_PRODUCTION : process.env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PERPAGE = 10

export const INVITATION_TYPE = {
  BOARD_INVITATION: 'BOARD_INVITATION'
}
export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}
export const DEFAULT_LABELS = [
  { name: 'Lỗi', color: '#EF4444' },
  { name: 'Tính năng', color: '#F97316' },
  { name: 'Đang thực hiện', color: '#EAB308' },
  { name: 'Hoàn thành', color: '#22C55E' },
  { name: 'Ưu tiên thấp', color: '#3B82F6' },
  { name: 'Ưu tiên cao', color: '#A855F7' },
  { name: 'Thiết kế', color: '#EC4899' },
  { name: 'Nghiên cứu', color: '#6B7280' }
]
// Thời gian lưu trong thùng rác (30 ngày)
export const BOARD_TRASH_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 ngày