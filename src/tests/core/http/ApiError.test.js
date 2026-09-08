import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
describe('ApiError', () => {
  it('Case : should create ApiError with statusCode and message', () => {
    const error = new ApiError(400, 'something went wrong')

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toBe('something went wrong')
    expect(error.statusCode).toBe(400)
  })

  it('Case : Should have strack Trace ', () => {
    const error = new ApiError(StatusCodes.CONFLICT, 'Some thing went conflict')

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('ApiError')
  })
})