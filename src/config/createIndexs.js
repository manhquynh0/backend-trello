import { GET_DB } from '~/config/database'
import { BOARD_TRASH_TTL_SECONDS } from '~/utils/constants'

// Cấu hình danh sách các collection cần áp dụng TTL Index
const TTL_CONFIGS = [
  { collectionName: 'boards', field: 'deletedAt', expireAfterSeconds: BOARD_TRASH_TTL_SECONDS },
  { collectionName: 'columns', field: 'deletedAt', expireAfterSeconds: BOARD_TRASH_TTL_SECONDS },
  { collectionName: 'cards', field: 'deletedAt', expireAfterSeconds: BOARD_TRASH_TTL_SECONDS }
]

export const createAllTTLIndexes = async () => {
  const db = GET_DB()

  // Duyệt qua mảng cấu hình và tạo Index tự động
  for (const config of TTL_CONFIGS) {
    await db.collection(config.collectionName).createIndex(
      { [config.field]: 1 },
      { expireAfterSeconds: config.expireAfterSeconds }
    )
  }
}
