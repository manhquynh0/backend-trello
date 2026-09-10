import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const mockUploadStream = jest.fn()
const mockCreateReadStream = jest.fn()

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: (...args) => mockUploadStream(...args)
    }
  }
}))

jest.mock('streamifier', () => ({
  createReadStream: (...args) => mockCreateReadStream(...args)
}))

describe('CloudinaryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('streamUpload', () => {
    it('should upload file successfully and return result', async () => {
      // Arrange
      const fileBuffer = Buffer.from('fake image data')
      const folderName = 'test-folder'

      const mockResult = {
        public_id: 'test-image',
        secure_url: 'https://cloudinary.com/test-image.jpg',
        resource_type: 'image'
      }

      // Fake Cloudinary upload stream
      const mockCloudinaryStream = {
        on: jest.fn()
      }

      mockUploadStream.mockImplementation((options, callback) => {
        // Giả lập Cloudinary upload thành công
        callback(null, mockResult)

        return mockCloudinaryStream
      })

      // Fake read stream
      const mockReadStream = {
        on: jest.fn(),
        pipe: jest.fn()
      }

      mockCreateReadStream.mockReturnValue(mockReadStream)

      // Act
      const result = await CloudinaryProvider.streamUpload(
        fileBuffer,
        folderName
      )

      // Assert
      expect(result).toEqual(mockResult)

      expect(mockUploadStream).toHaveBeenCalledWith(
        {
          folder: folderName,
          resource_type: 'auto'
        },
        expect.any(Function)
      )

      expect(mockCreateReadStream).toHaveBeenCalledWith(fileBuffer)

      expect(mockReadStream.pipe).toHaveBeenCalledWith(
        mockCloudinaryStream
      )
    })

    it('should reject when Cloudinary upload fails', async () => {
      // Arrange
      const fileBuffer = Buffer.from('fake image data')
      const folderName = 'test-folder'

      const cloudinaryError = new Error('Cloudinary upload failed')

      const mockCloudinaryStream = {
        on: jest.fn()
      }

      mockUploadStream.mockImplementation((options, callback) => {
        callback(cloudinaryError, null)

        return mockCloudinaryStream
      })

      const mockReadStream = {
        on: jest.fn(),
        pipe: jest.fn()
      }

      mockCreateReadStream.mockReturnValue(mockReadStream)

      // Act + Assert
      await expect(
        CloudinaryProvider.streamUpload(fileBuffer, folderName)
      ).rejects.toThrow('Cloudinary upload failed')

      expect(mockUploadStream).toHaveBeenCalledTimes(1)
    })

    it('should reject when read stream emits error', async () => {
      // Arrange
      const fileBuffer = Buffer.from('fake image data')
      const folderName = 'test-folder'

      const readStreamError = new Error('Read stream failed')

      let readStreamErrorHandler

      const mockReadStream = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            readStreamErrorHandler = handler
          }
        }),
        pipe: jest.fn()
      }

      mockCreateReadStream.mockReturnValue(mockReadStream)

      const mockCloudinaryStream = {
        on: jest.fn()
      }

      mockUploadStream.mockImplementation(() => {
        return mockCloudinaryStream
      })

      // Act
      const promise = CloudinaryProvider.streamUpload(
        fileBuffer,
        folderName
      )

      // Giả lập readStream phát sinh error
      readStreamErrorHandler(readStreamError)

      // Assert
      await expect(promise).rejects.toThrow('Read stream failed')
    })

    it('should reject when Cloudinary stream emits error', async () => {
      // Arrange
      const fileBuffer = Buffer.from('fake image data')
      const folderName = 'test-folder'

      const cloudinaryStreamError = new Error(
        'Cloudinary stream failed'
      )

      let cloudinaryStreamErrorHandler

      const mockCloudinaryStream = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            cloudinaryStreamErrorHandler = handler
          }
        })
      }

      mockUploadStream.mockImplementation(() => {
        return mockCloudinaryStream
      })

      const mockReadStream = {
        on: jest.fn(),
        pipe: jest.fn()
      }

      mockCreateReadStream.mockReturnValue(mockReadStream)

      // Act
      const promise = CloudinaryProvider.streamUpload(
        fileBuffer,
        folderName
      )

      // Giả lập Cloudinary stream phát sinh error
      cloudinaryStreamErrorHandler(cloudinaryStreamError)

      // Assert
      await expect(promise).rejects.toThrow(
        'Cloudinary stream failed'
      )
    })
  })
})