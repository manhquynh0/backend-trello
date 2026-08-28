export const userJoinCardSocket = (socket) => {
  socket.on('FE_USER_JOINED_CARD', (data) => {

    socket.broadcast.emit('BE_USER_JOINED_CARD', data)
  })
}
