import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
      socket.on('next-screen', msg => {
        socket.broadcast.emit('update-screen', msg)
      })

      socket.on('question-change', msg => {
        socket.broadcast.emit('update-question', msg)
      })

      socket.on('click-next-question', msg => {
        socket.broadcast.emit('update-web-question', msg)
      })

      socket.on('gaze-position-change', msg => {
        socket.broadcast.emit('update-gaze-position', msg)
      })

      socket.on('send-eyetracker-connection', msg => {
        socket.broadcast.emit('update-eyetracker-connection', msg)
      })
    })
  }
  res.end()
}

export default SocketHandler