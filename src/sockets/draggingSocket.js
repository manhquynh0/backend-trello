export const draggingSocket = (socket) => {

  // sự kiện người dùng tham gia vào board
  socket.on('FE_JOIN_BOARD', (boardId) => {
    console.log('user join board')
    socket.join(boardId)
  })
  // sự kiện người dùng ròi hoard
  socket.on('FE_LEAVE_BOARD', (boardId) => {
    console.log('user leave board')
    socket.leave(boardId)
  })

  // Sau khi kéo card xong
  socket.on('FE_DRAG_CARD', (data) => {
    console.log('user drag card')
    socket.to(data.boardId).emit('BE_DRAG_CARD', data)
  })


  // Sau khi kéo column xong
  socket.on('FE_DRAG_COLUMN', (data) => {
    console.log('user drag column')
    socket.to(data.boardId).emit('BE_DRAG_COLUMN', data)
  })


}