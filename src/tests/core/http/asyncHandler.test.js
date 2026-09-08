import {
  StatusCodes
} from 'http-status-codes'
import {
  errorHandlingMiddleware
} from '~/middlewares/errorHandlingMiddleware'

describe('errorHandlingMiddleware', () => {
  let req
  let next
  let res
  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    process.env.BUILD_MODE = 'dev'
  })
  it('Case : return statusCode, message, detail', () => {

    const err = new Error('Something went wrong')
    err.statusCode = StatusCodes.BAD_REQUEST
    errorHandlingMiddleware(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Something went wrong',
      stack: err.stack
    })
  })

  it('Case : Unhanlded Error > return statusCode 500', () => {
    const err = new Error('Something went wrong')
    errorHandlingMiddleware(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      stack: err.stack
    })
  })
  it('Case : should use statusCode reason phrase when error dose not have message', () => {
    const err = {
      statusCode: StatusCodes.ACCEPTED,
      stack: 'user'
    }
    errorHandlingMiddleware(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: StatusCodes.ACCEPTED,
      message: StatusCodes[StatusCodes.ACCEPTED],
      stack: 'user'
    })
  })
  // Khi bạn tạo res.json = jest.fn(), Jest tự động gắn cho nó một object .mock chứa lịch sử gọi hàm — số lần gọi, tham số mỗi lần gọi, giá trị trả về, v.v.
  // calls : Là một mảng 2 chiều, ghi lại tất cả các lần hàm res.json được gọi:
  it('Case : should return stack trace in dev environment', () => {
    process.env.BUILD_MODE = 'dev'
    const err = {
      statusCode: StatusCodes.ACCEPTED,
      message: 'Something went wrong',
      stack: 'user'
    }
    errorHandlingMiddleware(err, req, res, next)
    const response = res.json.mock.calls[0][0]
    expect(response).toHaveProperty('stack')
    expect(response.stack).toBe(err.stack)


  })
  it('Case : should not return stack trace in production environment', () => {
    process.env.BUILD_MODE = 'production'
    const err = {
      statusCode: StatusCodes.ACCEPTED,
      message: 'Something went wrong',
      stack: 'user'
    }
    errorHandlingMiddleware(err, req, res, next)
    const response = res.json.mock.calls[0][0]
    expect(response).not.toHaveProperty('stack')
    expect(response).toEqual({
      statusCode: StatusCodes.ACCEPTED,
      message: 'Something went wrong'
    })


  })
})