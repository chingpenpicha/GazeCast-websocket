import { useEffect, useState, useRef } from 'react'
import { getFaceStatus } from '../constant'

import io from 'socket.io-client'

const licenseKey = process.env.SEESO_KEY
let socket

const Webcamera = () => {


  const firstRenderRef = useRef(true);
  const [question, setQuestion] = useState(-1)
  const questionRef = useRef(-2)
  const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 })
  const [trackStatus, setTrackStatus] = useState('')

  const [seesoConnected, setSeesoConnected] = useState(false)
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 })

  let gaze_x
  let gaze_y
  let TrackingState

  function onGaze(gazeInfo) {
    // do something with gaze info.
    if (TrackingState && gazeInfo.trackingState === TrackingState.SUCCESS) {
      if (trackStatus !== getFaceStatus(0)) {
        setTrackStatus(getFaceStatus(gazeInfo.trackingState))
      }

      if (!seesoConnected) {
        setSeesoConnected(true)
      }

      setGazePosition({ ...gazeInfo })
      if (!gaze_x) {
        console.log("X_NAN")
      }
      if (!gaze_y) {
        console.log("Y_NAN")
      }

      gaze_x = gazeInfo.x
      gaze_y = gazeInfo.y
      const gazeObj = { gaze_x, gaze_y }

      if (questionRef.current > -1) {
        socket.emit('gaze-position-change', gazeObj)
      }

    } else if (TrackingState && gazeInfo.trackingState !== TrackingState.SUCCESS) {
      setTrackStatus(getFaceStatus(gazeInfo.trackingState))
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
    // // uncomment to protect dev double call
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
          questionRef.current = msg
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
        seeSo.setFaceDistance(50);
        seeSo.setCameraPosition(window.outerWidth / 2, false);
        seeSo.startTracking(onGaze, onDebug)
      }, () => { alert('init SeeSo failed') })

      setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    }

    initSeeSo()
  }, [])

  useEffect(() => {
    if (seesoConnected) {
      socket.emit('send-eyetracker-connection', { w: windowSize.w, h: windowSize.h })
    }
  }, [seesoConnected])

  if (question > 6) {
    return (
      <div className='alignCenter'>
        <h1>Thank you for participating in the GazeCast experiment</h1>
        <h1>Now you can close your mobile</h1>

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
        <button className="start-button" onClick={sendNext}>Start</button>
      </>}
      {(question > 0 && question <= 6) && <div>
        <p>{`current question : ${question}`}</p>
        Follow the <span className='pink'>PINK</span> potato!
      </div>}
      <hr />
      <h4>Tracking status : {trackStatus}</h4>
      <h4>{`gazeX : ${gazePosition.x}`}</h4>
      <h4>{`gazeY : ${gazePosition.y}`}</h4>

    </div>
  )
}

export default Webcamera;