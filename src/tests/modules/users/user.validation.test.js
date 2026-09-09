import { mockRequest } from '../../helpers/mockRequestResponse'
import { mockResponse } from '../../helpers/mockRequestResponse'
import { mockNext } from '../../helpers/mockRequestResponse'
import { userValidation } from '~/validations/userValidation'
import StatusCodes from 'http-status-codes'
import ApiError from '~/utils/ApiError'
describe('User validation > Joi Schema', () => {
  const makeInput = (data = {}) => ({
    body: {
      email: 'admin@vumanhquynh.com',
      password: 'Quynh@2005',
      ...data
    },
    params: {},
    query: {}
  })

  it('Should call next validation when body is valid', async () => {
    const { body } = makeInput()
    const req = mockRequest({ body })
    const res = mockResponse()
    const next = mockNext()
    await userValidation.createNew(req, res, next)
    expect(next).toHaveBeenCalledWith()
  })
  test.each([
    { data: { email: undefined }, expectedField: 'email', caseName: 'thiếu email' },
    { data: { password: undefined }, expectedField: 'password', caseName: 'thiếu password' },
    { data: { email: 'invalid-email' }, expectedField: 'email', caseName: 'email sai định dạng' },
    { data: { password: '123' }, expectedField: 'password', caseName: 'password sai định dạng' }
  ])('Should fail validation when $caseName', async ({ data }) => {
    const { body } = makeInput({ body: data })
    const req = mockRequest({ body })
    const res = mockResponse()
    const next = mockNext()

    await userValidation.createNew(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)

    const errorArg = next.mock.calls[0][0]
    expect(errorArg).toBeInstanceOf(ApiError)
    expect(errorArg.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
  })
})