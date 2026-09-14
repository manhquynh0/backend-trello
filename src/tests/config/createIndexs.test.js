import { createAllTTLIndexes } from '~/config/createIndexs'
import { GET_DB } from '~/config/database'
import { BOARD_TRASH_TTL_SECONDS } from '~/utils/constants'

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn()
}))

describe('createIndexs', () => {
  it('should call createIndex on boards, columns, and cards collections with correct TTL', async () => {
    const mockCreateIndex = jest.fn().mockResolvedValue(true)
    const mockCollection = jest.fn().mockReturnValue({
      createIndex: mockCreateIndex
    })
    const mockDb = {
      collection: mockCollection
    }
    GET_DB.mockReturnValue(mockDb)

    await createAllTTLIndexes()

    expect(mockCollection).toHaveBeenCalledWith('boards')
    expect(mockCollection).toHaveBeenCalledWith('columns')
    expect(mockCollection).toHaveBeenCalledWith('cards')
    expect(mockCreateIndex).toHaveBeenCalledTimes(3)
    expect(mockCreateIndex).toHaveBeenCalledWith(
      { deletedAt: 1 },
      { expireAfterSeconds: BOARD_TRASH_TTL_SECONDS }
    )
  })
})
