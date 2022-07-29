import { useEffect, useState, useRef } from 'react'
import { getFaceStatus } from '../constant'

import io from 'socket.io-client'

const licenseKey = process.env.SEESO_KEY
let socket

const SCREEN_WIDTH = 1920
const SCREEN_HEIGHT = 1001
// const MOBILE_WIDTH

const MobileEyeTrack = () => {
    const firstRenderRef = useRef(true);
    const [question, setQuestion] = useState(-1)
    const questionRef = useRef(-2)

    const [seesoConnected, setSeesoConnected] = useState(false)
    const [trackStatus, setTrackStatus] = useState('')
    const [windowSize, setWindowSize] = useState({ w: 0, h: 0 })
    const [gazePosition, setGazePosition] = useState({ x: 0, y: 0 })

    let gaze_x
    let gaze_y
    let TrackingState

    function onGaze(gazeInfo) {
        // do something with gaze info.
        // console.log('gazeInfo', gazeInfo.x, gazeInfo.y)
        if (TrackingState && gazeInfo.trackingState === TrackingState.SUCCESS) {
            if (trackStatus !== getFaceStatus(0)) {
                setTrackStatus(getFaceStatus(gazeInfo.trackingState))
            }

            if (!seesoConnected) {
                setSeesoConnected(true)
            }

            setGazePosition({ ...gazeInfo })

            gaze_x = gazeInfo.x
            gaze_y = gazeInfo.y
            let new_gaze_x = gaze_x * SCREEN_WIDTH / window.innerWidth
            let new_gaze_y = gaze_y * SCREEN_HEIGHT / window.innerHeight

            const gazeObj = { gaze_x: new_gaze_x, gaze_y: new_gaze_y }

            //continuing sending objet position
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
                // seeSo.setMonitorSize(32);
                seeSo.setFaceDistance(25);
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
            <h1>Welcome to GazeCast experiment</h1>
            {(question < 0 && seesoConnected) && <>
                <h4>
                    Connected with the display!
                </h4>
                <button className="start-button" onClick={sendNext}>Start</button>
            </>}
            {(question >= 0 && question <= 6) && <>
                <p>{`Current question : ${question}`}</p>
                <div>
                    Follow the <span className='pink'>PINK</span> potato!
                </div>
            </>}
            <br />
            <hr />
            <h4>Tracking status : {trackStatus}</h4>
            <h4>{`gazeX : ${gazePosition.x}`}</h4>
            <h4>{`gazeY : ${gazePosition.y}`}</h4>

            <p>window w: {windowSize.w} </p>
            <p>window h: {windowSize.h} </p>
        </div>
    )
}

export default MobileEyeTrack;