/* eslint-disable no-useless-catch */
import Jwt from 'jsonwebtoken'
require('dotenv').config()
const generateToken = (userInfor, secretSignature, tokenLife) => {
  try {
    return Jwt.sign(userInfor, secretSignature, {
      expiresIn: tokenLife
    })
  } catch (error) {
    throw error
  }
}
const verifyToken = (userInfor, secretSignature) => {
  try {

    return Jwt.verify(userInfor, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}
export const JwtProvider = {
  generateToken,
  verifyToken
}