import { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

const WINDOW_SIZE = 1000 // 1 second
const licenseKey = process.env.SEESO_KEY
let socket

const Webcamera = () => {


  const firstRenderRef = useRef(true);
  const [question, setQuestion] = useState(-1)
  const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 })
  const [seesoConnected, setSeesoConnected] = useState(false)
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 })
  const [gazeLog, setGazeLog] = useState({
    max_x: -1000, max_y: -1000, min_x: 2000, min_y: 2000
  })
  let logGazeX = []
  let logGazeY = []
  let gaze_x
  let gaze_y
  let TrackingState

  function onGaze(gazeInfo) {
    // do something with gaze info.
    if (TrackingState && gazeInfo.trackingState === TrackingState.SUCCESS) {
      if (!seesoConnected) {
        setSeesoConnected(true)
      }

      let gazeLog_temp = gazeLog
      setGazePosition({ ...gazeInfo })
      if (!gaze_x) {
        console.log("X_NAN")
      }
      if (!gaze_y) {
        console.log("Y_NAN")
      }

      gaze_x = gazeInfo.x
      gaze_y = gazeInfo.y
      const gazeObj = { gaze_x, gaze_y, page: 'webcam' }

      socket.emit('gaze-position-change', gazeObj)

      if (gaze_x) {
        logGazeX.push(gaze_x)
      }
      if (gaze_y) {
        logGazeY.push(gaze_y)
      }

      if (gaze_x > gazeLog.max_x) {
        gazeLog_temp.max_x = gaze_x
      }

      if (gaze_x < gazeLog.min_x) {
        gazeLog_temp.min_x = gaze_x
      }

      if (gaze_y > gazeLog.max_y) {
        gazeLog_temp.max_y = gaze_y
      }

      if (gaze_x < gazeLog.min_y) {
        gazeLog_temp.min_y = gaze_y
      }

      setGazeLog(gazeLog_temp)
    }
  }

  // debug callback.
  function onDebug(FPS, latency_min, latency_max, latency_avg) {
    // do something with debug info.
    // alert("err")
    // console.log('BUG', FPS, latency_min, latency_max, latency_avg)
  }

  const sendNext = () => {
    socket.emit('click-next-question', question)
  }

  useEffect(() => {
    // for dev
    // protect double call 
    // if (firstRenderRef.current) {
    //   firstRenderRef.current = false;
    //   return;
    // }

    const socketInitializer = async () => {
      await fetch('/api/socket');
      socket = io()

      if (socket) {
        socket.on('connect', () => {
          console.log('connected')
        })

        socket.on('update-question', msg => {
          setQuestion(msg)
        })
      }
    }
    socketInitializer()

    const initSeeSo = async () => {
      const EasySeeSo = await import('../seeso-minjs/easy-seeso')
      const temp = await import('../seeso-minjs/seeso.min.js')

      /**
       * set monitor size.    default: 13 inch.
       * set face distance.   default: 30 cm.
       * set camera position. default:
       * camera x: right center
       * cameraOnTop: true
       */
      const seeSo = new EasySeeSo.default();
      TrackingState = temp.TrackingState

      console.log(seeSo)
      await seeSo.init(licenseKey, () => {
        seeSo.setMonitorSize(32); //22
        seeSo.setFaceDistance(45);
        // seeSo.setCameraPosition(window.outerWidth / 2, true);
        seeSo.startTracking(onGaze, onDebug)
      }, () => { alert('init SeeSo failed') })

      setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    }

    initSeeSo()

    //continuing sending objet position
    // setTimeout(function run() {
    //   // get the x and y coordinates of the labels and assign them
    //   const gazeObj = { gaze_x: logGazeX, gaze_y: logGazeY, page: 'webcam' }
    //   logGazeX = []
    //   logGazeY = []
    //   socket.emit('gaze-position-change', gazeObj)
    //   setTimeout(run, WINDOW_SIZE); // To continue sending object postion
    // }, WINDOW_SIZE);

  }, [])

  useEffect(() => {
    if (seesoConnected) {
      socket.emit('send-eyetracker-connection', true)
    }
  }, [seesoConnected])

  if (question > 6) {
    return (
      <div className='alignCenter'>
        <h1>Thank you for participating in the GazeCast experiment</h1>
        <h1>Now you can close your mobile</h1>
        <p>X range: {gazeLog.min_x} - {gazeLog.max_x}</p>
        <p>Y range: {gazeLog.min_y} - {gazeLog.max_y}</p>
      </div>
    )
  }


  return (
    <div className='alignCenter'>
      <h1>Gaze positions</h1>
      {(question < 0 && seesoConnected) && <>
        <h4>
          Connected with the display!
        </h4>
        <button className="start-button" onClick={sendNext}>{question === -1 ? "Start" : "Next"}</button>
      </>}
      {(question > 0 && question <= 6) && <div>
        <p>{`current question : ${question}`}</p>
        Find the <span className='pink'>PINK</span> potato!
      </div>}
      <h4>{`gazeX : ${gazePosition.x}`}</h4>
      <h4>{`gazeY : ${gazePosition.y}`}</h4>
      <p>X range: {gazeLog.min_x} -- {gazeLog.max_x}</p>
      <p>Y range: {gazeLog.min_y} -- {gazeLog.max_y}</p>
      <p>window w: {windowSize.w} </p>
      <p>window h: {windowSize.h} </p>
    </div>
  )
}

export default Webcamera;