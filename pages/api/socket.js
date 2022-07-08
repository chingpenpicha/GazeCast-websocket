import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
    //   socket.on('input-change', msg => {
    //     socket.broadcast.emit('update-input', msg)
    //     console.log('change')
    //   })

      socket.on('object-position-change', msg => {
        socket.broadcast.emit('update-object-position', msg)
        // console.log('gaze',msg)
      })

      socket.on('submit-answer', msg => {
        socket.broadcast.emit('update-answer', msg)
        console.log('answer',msg)
      })
    })
  }
  res.end()
}

export default SocketHandler