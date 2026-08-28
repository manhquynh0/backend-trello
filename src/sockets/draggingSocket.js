export const draggingSocket = (socket) => {

  // sự kiện người dùng tham gia vào board
  socket.on('FE_JOIN_BOARD', (boardId) => {
    socket.join(boardId)
  })
  // sự kiện người dùng ròi hoard
  socket.on('FE_LEAVE_BOARD', (boardId) => {
    socket.leave(boardId)
  })

  // Sau khi kéo card xong
  // socket.on('FE_DRAG_CARD', (data) => {
  //   socket.leave(boardId)
  // })


  // Sau khi kéo column xong
  socket.on('FE_DRAG_COLUMN', (boardId) => {
    socket.leave(boardId)
  })




}