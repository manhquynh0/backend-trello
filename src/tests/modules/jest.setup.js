process.env.NODE_ENV = 'test'
process.env.TIMEZONE = process.env.TIMEZONE || 'UTC'

// Tùy chọn để tắt console trong quá trình chạy test
const shouldMuteConsole = !!process.env.CI || process.env.CI === 'true' || process.env.JEST_MUTE_CONSOLE === 'true'

if (shouldMuteConsole) {
  // chạy 1 lần trước toàn bộ test
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'warn').mockImplementation(() => { })
    jest.spyOn(console, 'info').mockImplementation(() => { })

    // Giữ nguyên log lỗi
    // jest.spyOn(console, 'error').mockImplementation(() => { })
  })
  // sau mỗi lần test
  afterEach(() => {
    jest.clearAllMocks()  // xóa lịch sử cuộc gọi của các mock ( calls/ result / instance)
    jest.restoreAllMocks() // trả spyOn về implementation gốc
  })

  // Nếu dự án dùng fake timers jest.useFakeTimers() thì mở đoạn code này để không ảnh hưởng tới các tests khác nhau
  // afterAll(() => {
  //   jest.useRealTimers()  
  // })
}