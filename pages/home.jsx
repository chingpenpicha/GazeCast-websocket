import { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

let socket;
const licenseKey = process.env.SEESO_KEY

const Home = () => {
  // const [input, setInput] = useState('')
  const [objectPositions, setObjectPositions] = useState({})
  const firstRenderRef = useRef(true);
  const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 })

  function onGaze(gazeInfo) {
    // do something with gaze info.
    // if (gazeInfo.trackingState === TrackingState?.SUCCESS) {
    // console.log('gazeInfo', gazeInfo.x, gazeInfo.y)
    setGazePosition({ ...gazeInfo })
    // gazeX = gazeInfo.x
    // gazeY = gazeInfo.y

    // }
  }

  // debug callback.
  function onDebug(FPS, latency_min, latency_max, latency_avg) {
    // do something with debug info.
    // console.log('BUG', FPS, latency_min, latency_max, latency_avg)
  }

  useEffect(() => {
    // protect double call
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

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

    socketInitializer()

    const initSeeSo = async () => {
      const EasySeeSo = await import('seeso/easy-seeso')
      /**
       * set monitor size.    default: 16 inch.
       * set face distance.   default: 30 cm.
       * set camera position. default:
       * camera x: right center
       * cameraOnTop: true
       */
      const seeSo = new EasySeeSo.default();
      // console.log(seeSo)
      await seeSo.init(licenseKey, () => {
        seeSo.setMonitorSize(16);
        seeSo.setFaceDistance(50);
        seeSo.setCameraPosition(window.outerWidth / 2, true);
        seeSo.startTracking(onGaze, onDebug)
      }, () => { console.log("callback when init failed"); alert('init See So failed') })
    }

    initSeeSo()
  }, [])



  // const onChangeHandler = (e) => {
  //   setInput(e.target.value)
  //   socket.emit('submit-answer', e.target.value)
  // }


  return (
    <div>
      <h1>Gaze object positions</h1>
      {`1 = circular, 2 = zigzag, 3= diagonal`}
      {Object.keys(objectPositions).map(key => <h3>{`${key} :${objectPositions[key]}`}</h3>)}
      <h4>{`gazeX : ${gazePosition.x}`}</h4>
      <h4>{`gazeY : ${gazePosition.y}`}</h4>
      <button onClick={() => socket.emit('submit-answer', 'answerOne')}>1</button>
      <button onClick={() => socket.emit('submit-answer', 'answerTwo')}>2</button>
      <button onClick={() => socket.emit('submit-answer', 'answerThree')}>3</button>
    </div>
  )
}

export default Home;