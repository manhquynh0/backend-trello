require('dotenv').config()
import {
  StatusCodes
} from 'http-status-codes'

import {
  JwtProvider
} from '~/providers/JwtProvider'
import ApiError from '~/utils/ApiError'


const isAuthorized = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken

  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized !, token not found'))
  }
  try {
    // b1 : giai ma xem token co hop le hay khong
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, process.env.ACCESS_SECRET_SIGNATURE)
    // b2 : neu token hop le thi luu thong tin giai ma vao req de xu ly o cac tang tiep theo
    req.jwtDecoded = accessTokenDecoded

    // b3 : cho phep request di tiep
    next()


  } catch (error) {
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refreshToken'))
    }
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized !'))

  }
}
export const authMiddleware = {
  isAuthorized
}