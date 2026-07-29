import slugify from '../untils/formatter'

const createNew = async (reqBody) => {
  try {

    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    console.log(newBoard)
    return newBoard
  } catch (error) {
    throw error
  }
}
export const boardService = {
  createNew
}