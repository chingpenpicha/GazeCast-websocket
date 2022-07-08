import { useEffect, useState } from 'react'
import io from 'socket.io-client'
let socket;

const Home = () => {
  // const [input, setInput] = useState('')
  const [objectPositions, setObjectPositions] = useState({})

  useEffect(() => { socketInitializer() }, [])

  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io()

    socket.on('connect', () => {
      console.log('connected')
    })

    socket.on('update-object-position', obj => {
      setObjectPositions(obj)
    })
  }

  // const onChangeHandler = (e) => {
  //   setInput(e.target.value)
  //   socket.emit('submit-answer', e.target.value)
  // }

  return (
    <div>
      <h1>Gaze object positions</h1>
      {`1 = circular, 2 = zigzag, 3= diagonal`}
      {Object.keys(objectPositions).map(key => <h3>{`${key} :${objectPositions[key]}`}</h3>)}
      <button onClick={() => socket.emit('submit-answer', 'answerOne')}>1</button>
      <button onClick={() => socket.emit('submit-answer', 'answerTwo')}>2</button>
      <button onClick={() => socket.emit('submit-answer', 'answerThree')}>3</button>
    </div>
  )
}

export default Home;