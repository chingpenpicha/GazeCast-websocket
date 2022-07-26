import { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

const WINDOW_SIZE = 2000 // 2 second
const licenseKey = process.env.SEESO_KEY
let socket

const MobileEyeTrack = () => {
    const firstRenderRef = useRef(true);
    const [question, setQuestion] = useState(-1)
    const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 })
    const [gazeLog, setGazeLog] = useState({
        max_x: -1000, max_y: -1000, min_x: 2000, min_y: 2000
    })
    let gaze_x
    let gaze_y

    function onGaze(gazeInfo) {
        // do something with gaze info.
        // console.log('gazeInfo', gazeInfo.x, gazeInfo.y)
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

    // debug callback.
    function onDebug(FPS, latency_min, latency_max, latency_avg) {
        // do something with debug info.
        // alert("err")
        // console.log('BUG', FPS, latency_min, latency_max, latency_avg)
    }

    const sendNext = () => {
        socket.emit('click-next-question', question + 1)
    }

    useEffect(() => {
        // for dev
        // protect double call 
        // if (firstRenderRef.current) {
        //     firstRenderRef.current = false;
        //     return;
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
                seeSo.setMonitorSize(32);
                seeSo.setFaceDistance(25);
                // seeSo.setCameraPosition(window.outerWidth / 2, true);
                seeSo.startTracking(onGaze, onDebug)
                socket.emit('send-eyetracker-connection', true)
            }, () => { alert('init SeeSo failed') })
        }

        initSeeSo()

        //continuing sending objet position
        setTimeout(function run() {
            // get the x and y coordinates of the labels and assign them
            if (gaze_x && gaze_y) {
                const gazeObj = { gaze_x, gaze_y, page: 'mobile' }
                socket.emit('gaze-position-change', gazeObj)
            }
            setTimeout(run, WINDOW_SIZE); // To continue sending object postion
        }, WINDOW_SIZE);

    }, [])

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
            <h1>Welcome to GazeCast experiment</h1>
            {question < 0 && <>
                <h4>
                    Connected with the display!
                </h4>
                <button onClick={sendNext}>Next</button>
            </>}
            {(question >= 0 && question <= 6) && <>
                <p>{`Current question : ${question}`}</p>
                <div>
                    Find the <span className='pink'>PINK</span> potato!
                </div>
            </>}
            <br />
            <h4>{`gazeX : ${gazePosition.x}`}</h4>
            <h4>{`gazeY : ${gazePosition.y}`}</h4>
            <p>X range: {gazeLog.min_x} - {gazeLog.max_x}</p>
            <p>Y range: {gazeLog.min_y} - {gazeLog.max_y}</p>
        </div>
    )
}

export default MobileEyeTrack;