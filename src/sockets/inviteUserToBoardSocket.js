export const inviteUserToBoardSocket = (socket) => {
  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
    // Cách làm nhanh và đơn giản là emit ngược lại một sự kiện về cho mọi Client trừ thằng đang gửi request
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })

}