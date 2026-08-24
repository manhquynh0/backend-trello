export const userJoinCardSocket = (socket) => {
  socket.on('FE_USER_JOINED_CARD', (data) => {
    console.log('Backend received FE_USER_JOINED_CARD:', data?.user?.displayName, data?.action)
    socket.broadcast.emit('BE_USER_JOINED_CARD', data)
  })
}
