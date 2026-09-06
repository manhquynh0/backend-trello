import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  cardModel
} from '~/models/cardModel'
import {
  columnModel
} from '../models/columnModel'
import {
  CloudinaryProvider
} from '~/providers/CloudinaryProvider'
import { redisHelper } from '~/helpers/redisHelper'
import { userModel } from '~/models/userModel'
import { v4 as uuid } from 'uuid'
import { DEFAULT_LABELS } from '~/utils/constants'
import { ObjectId } from 'mongodb'
const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const newcard = {
      ...reqBody,
      labels: DEFAULT_LABELS.map(label => {
        return {
          ...label,
          _id: new ObjectId().toString()
        }
      })

    }
    const createdcard = await cardModel.createNew(newcard)

    const getNewcard = await cardModel.findOneById(createdcard.insertedId)
    if (getNewcard) {
      await columnModel.pushCardOrderIds(getNewcard)
      // Xóa cache Board trong Redis để khi F5 trang sẽ nạp lại Board có Card mới từ MongoDB
      if (reqBody.boardId) {
        await redisHelper.del(`board:${reqBody.boardId}`)
      }
    }
    return getNewcard
  } catch (error) {
    throw error
  }
}
const getDetails = async (cardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const key = `card:${cardId}`
    const cacheCard = await redisHelper.get(key)
    if (cacheCard) {
      return cacheCard
    }
    const card = await cardModel.getDetails(cardId)
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Card Not Found!')
    }
    await redisHelper.set(key, card)
    return card
  } catch (error) {
    throw error
  }
}
const updatedCard = async (cardId, reqBody, cardCoverFile, attachmentsFiles, userInfor) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const key = `card:${cardId}`
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    const currentUser = await userModel.findOneById(userInfor._id)
    let updateCard = {}
    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
      updateCard = await cardModel.updatedCard(cardId, {
        cover: uploadResult.secure_url
      })

    } else if (attachmentsFiles) {
      const uploadResult = await CloudinaryProvider.streamUpload(attachmentsFiles.buffer, 'attachments')

      const attachmentData = {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        filetype: attachmentsFiles.mimetype,
        name: attachmentsFiles.originalname,
        createdAt: Date.now(),
        userId: userInfor._id,
        userAvatar: currentUser?.avatar,
        userDisplayName: currentUser?.displayName
      }
      updateCard = await cardModel.unshiftAttachment(cardId, attachmentData)

    } else if (updateData.commentToAdd) {
      const commentData = {
        ...updateData.commentToAdd,
        commentAt: Date.now(),
        userId: userInfor._id,
        userEmail: userInfor.email
      }
      updateCard = await cardModel.unshiftComment(cardId, commentData)

    } else if (updateData.incomingMemberInfo) {
      updateCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)

    } else {
      updateCard = await cardModel.updatedCard(cardId, updateData)
    }
    await redisHelper.del(key)

    return updateCard
  } catch (error) {
    throw error
  }
}

const deleteAttachment = async (cardId, attachmentId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const result = await cardModel.deleteAttachment(cardId, attachmentId)
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment Not Found!')
    }
    // await CloudinaryProvider.destroy(attachmentId)
    await redisHelper.del(`card:${cardId}`)
    return result
  } catch (error) {
    throw error
  }
}
const createdAttachment = async (cardId, reqBody, userInfor) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const attachment = {
      ...reqBody.attachments[0]
    }

    const currentUser = await userModel.findOneById(userInfor._id)

    const attachmentData = {
      ...attachment,
      publicId: uuid(),
      url: attachment.url,
      filetype: attachment.filetype,
      name: attachment.name,
      createdAt: Date.now(),
      userId: userInfor._id,
      userAvatar: currentUser?.avatar,
      userDisplayName: currentUser?.displayName
    }
    const createdAttachment = await cardModel.unshiftAttachment(cardId, attachmentData)
    await redisHelper.del(`card:${cardId}`)
    return createdAttachment
  } catch (error) {
    throw error
  }
}
const createdLabel = async (cardId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const label = {
      ...reqBody,
      _id: new ObjectId().toString()
    }

    const createdLabel = await cardModel.createdLabel(cardId, label)
    await redisHelper.del(`card:${cardId}`)
    return createdLabel
  } catch (error) {
    throw error
  }
}
const archivedCard = async (cardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const result = await cardModel.archivedCard(cardId)
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment Not Found!')
    }
    await redisHelper.del(`card:${cardId}`)
    return result
  } catch (error) {
    throw error
  }
}
const updateLabel = async (cardId, labelId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    let data = {}
    if (reqBody.name !== undefined) {
      data.name = reqBody.name
    }
    if (reqBody.color !== undefined) {
      data.color = reqBody.color
    }
    if (reqBody.isActive !== undefined) {
      data.isActive = reqBody.isActive
    }
    const result = await cardModel.updateLabel(cardId, labelId, data)
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Label Not Found!')
    }
    await redisHelper.del(`card:${cardId}`)
    return result
  } catch (error) {
    throw error
  }
}
const getLabels = async (cardId, filterStage) => {

  return await cardModel.getLabels(cardId, filterStage)
}
const createdChecklist = async (cardId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const checklistData = {
      ...reqBody,
      isSuccess: false,
      subItems: [],
      _id: new ObjectId().toString()
    }
    const createdChecklist = await cardModel.createdChecklist(cardId, checklistData)
    await redisHelper.del(`card:${cardId}`)
    return createdChecklist
  } catch (error) {
    throw error
  }
}
const createdChecklistItem = async (cardId, checklistId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const checklistItemData = {
      ...reqBody,
      _id: new ObjectId().toString()
    }
    const result = await cardModel.createdChecklistItem(cardId, checklistId, checklistItemData)
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Card or Checklist Not Found!')
    }
    await redisHelper.del(`card:${cardId}`)
    return result
  } catch (error) {
    throw error
  }
}
export const cardService = {
  createNew,
  getDetails,
  updatedCard,
  deleteAttachment,
  createdAttachment,
  archivedCard,
  getLabels,
  createdLabel,
  updateLabel,
  createdChecklist,
  createdChecklistItem
}