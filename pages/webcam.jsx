import { useEffect, useState, useRef } from 'react'
// import the fn for correlation
import calculateCorrelation from "calculate-correlation"
import io from 'socket.io-client'

const licenseKey = process.env.SEESO_KEY
let socket
const THRESHOLD = 0.8

const EyeTrack = () => {
  const firstRenderRef = useRef(true);
  const [question, setQuestion] = useState(-1)
  const [objectPositions, setObjectPositions] = useState({})
  const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 })

  let gaze_x
  let gaze_y
  //On Load 
  // const id = useRef(props.id)
  const logLabelPositionOne_x = [];
  const logLabelPositionOne_y = [];
  const logLabelPositionTwo_x = [];
  const logLabelPositionTwo_y = [];
  const logLabelPositionThree_x = [];
  const logLabelPositionThree_y = [];
  const logGazePosition_x = [];
  const logGazePosition_y = [];
  const logGazeTime = [];

  // calculates Correlation
  function _calculateCorrelation(obj) {
    const { answerOne_x, answerOne_y, answerTwo_x, answerTwo_y, answerThree_x, answerThree_y } = obj

    //if gaze x and gaze y have value
    if (gaze_x && gaze_y) {
      // push gaze data into the arrays
      logGazePosition_x.push(gaze_x)
      logGazePosition_y.push(gaze_y)
      // push label positions into the arrays
      logLabelPositionOne_x.push(answerOne_x)
      logLabelPositionOne_y.push(answerOne_y)
      logLabelPositionTwo_x.push(answerTwo_x)
      logLabelPositionTwo_y.push(answerTwo_y)
      logLabelPositionThree_x.push(answerThree_x)
      logLabelPositionThree_y.push(answerThree_y)
      // logGazeTime.push(gaze_time)

      // calculate the correlation
      // if (logGazePosition_x.length > 5) {
      let corAnswerOne_x = calculateCorrelation(logLabelPositionOne_x, logGazePosition_x);
      let corAnswerOne_y = calculateCorrelation(logLabelPositionOne_y, logGazePosition_y);
      let corAnswerTwo_x = calculateCorrelation(logLabelPositionTwo_x, logGazePosition_x);
      let corAnswerTwo_y = calculateCorrelation(logLabelPositionTwo_y, logGazePosition_y);
      let corAnswerThree_x = calculateCorrelation(logLabelPositionThree_x, logGazePosition_x);
      let corAnswerThree_y = calculateCorrelation(logLabelPositionThree_y, logGazePosition_y);

      // calculate correlation
      let corAnswerOne = corAnswerOne_x < corAnswerOne_y ? corAnswerOne_x : corAnswerOne_y;
      let corAnswerTwo = corAnswerTwo_x < corAnswerTwo_y ? corAnswerTwo_x : corAnswerTwo_y;
      let corAnswerThree = corAnswerThree_x < corAnswerThree_y ? corAnswerThree_x : corAnswerThree_y;
      // console.log('cal results: ', corAnswerOne, corAnswerTwo, corAnswerThree)

      if (((corAnswerOne) > THRESHOLD) && (corAnswerOne > corAnswerTwo) && (corAnswerOne > corAnswerThree)) {
        socket.emit('submit-answer', 'answerOne')
        empty()
      } else if (((corAnswerTwo) > THRESHOLD) && (corAnswerTwo > corAnswerOne) && (corAnswerTwo > corAnswerThree)) {
        socket.emit('submit-answer', 'answerTwo')
        empty()
      } else if (((corAnswerThree) > THRESHOLD) && (corAnswerThree > corAnswerOne) && (corAnswerThree > corAnswerTwo)) {
        socket.emit('submit-answer', 'answerThree')
        empty()
      }
      // }

      /// clear array
      if (logLabelPositionOne_x.length > 300) {
        empty()
      }
      console.log(corAnswerOne, corAnswerTwo, corAnswerThree)
    }
  }

  function empty() {
    logLabelPositionOne_x.length = 0;
    logLabelPositionOne_y.length = 0;
    logLabelPositionTwo_x.length = 0;
    logLabelPositionTwo_y.length = 0;
    logLabelPositionThree_x.length = 0;
    logLabelPositionThree_y.length = 0;
    logGazePosition_x.length = 0;
    logGazePosition_y.length = 0;
    logGazeTime.length = 0;
  }


  function onGaze(gazeInfo) {
    // do something with gaze info.
    // console.log('gazeInfo', gazeInfo.x, gazeInfo.y)
    setGazePosition({ ...gazeInfo })
    if (!gaze_x) {
      console.log("X_NAN")
    }
    if (!gaze_y) {
      console.log("Y_NAN")
    }
    gaze_x = gazeInfo.x
    gaze_y = gazeInfo.y
  }

  // debug callback.
  function onDebug(FPS, latency_min, latency_max, latency_avg) {
    // do something with debug info.
    // console.log('BUG', FPS, latency_min, latency_max, latency_avg)
  }

  useEffect(() => {
    // for dev
    // protect double call 
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    const socketInitializer = async () => {
      await fetch('/api/socket');
      socket = io()

      if (socket) {
        socket.on('connect', () => {
          console.log('connected')
        })

        socket.on('update-object-position', obj => {
          updateObjectPositions(obj)
        })

        socket.on('update-question', msg => {
          console.log('get', msg)
          setQuestion(msg)
        })
      }
    }

    const updateObjectPositions = (obj) => {
      _calculateCorrelation(obj)
      setObjectPositions(obj)
    }

    socketInitializer()

    const initSeeSo = async () => {
      const EasySeeSo = await import('../seeso-minjs/easy-seeso')
      /**
       * set monitor size.    default: 13 inch.
       * set face distance.   default: 30 cm.
       * set camera position. default:
       * camera x: right center
       * cameraOnTop: true
       */
      const seeSo = new EasySeeSo.default();
      console.log(seeSo)
      await seeSo.init(licenseKey, () => {
        seeSo.setMonitorSize(13);
        seeSo.setFaceDistance(40);
        // seeSo.setCameraPosition(window.outerWidth / 2, true);
        seeSo.startTracking(onGaze, onDebug)
      }, () => { alert('init SeeSo failed') })
    }

    initSeeSo()
  }, [])

  return (
    <div className='alignCenter'>
      <h1>Gaze object positions</h1>
      <p>{`current question : ${question}`}</p>
      {`1 = circular, 2 = zigzag, 3= diagonal`}
      {Object.keys(objectPositions).map(key => <h4 key={key}>{`${key} :${objectPositions[key]}`}</h4>)}
      <h4>{`gazeX : ${gazePosition.x}`}</h4>
      <h4>{`gazeY : ${gazePosition.y}`}</h4>
      {question > 0 &&
        <>
          <button onClick={() => socket.emit('submit-answer', 'answerOne')}>1</button>
          <button onClick={() => socket.emit('submit-answer', 'answerTwo')}>2</button>
          <button onClick={() => socket.emit('submit-answer', 'answerThree')}>3</button>
        </>
      }
      {question < 1 &&
        <p><button className='eyevotebutton marginTop' onClick={() => {
          if (question < 1) {
            socket.emit('next-screen', question)
          } else {
            socket.emit('submit-answer', 'answerThree')
          }
        }}>
          NEXT
        </button>
        </p>
      }
    </div>
  )
}

export default EyeTrack;