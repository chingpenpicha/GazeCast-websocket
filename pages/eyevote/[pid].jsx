import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
// import the fn for correlation
import calculateCorrelation from "calculate-correlation"

import io from 'socket.io-client'
import { useRouter } from 'next/router'

const WINDOW_SIZE = 2000 // 2 second
const THRESHOLD = 0.7

const WEBCAMERA = 'WEBCAMERA'
const MOBILE_WITH_HAND = 'MOBILE_WITH_HAND'
const MOBILE_WITH_STAND = 'MOBILE_WITH_STAND'

const questionArray = [{
    1: { one: true, },
    2: { two: true, },
    3: { three: true },
    4: { three: true },
    5: { one: true, },
    6: { two: true, },
    7: { two: true, },
    8: { three: true },
    9: { one: true },
},
{
    1: { two: true, },
    2: { three: true, },
    3: { one: true },
    4: { one: true },
    5: { two: true, },
    6: { three: true, },
    7: { three: true, },
    8: { one: true },
    9: { two: true },
},
{
    1: { three: true, },
    2: { one: true, },
    3: { two: true },
    4: { two: true },
    5: { three: true, },
    6: { one: true, },
    7: { one: true, },
    8: { two: true },
    9: { three: true },
},]


let socket

const EyeVote = (props) => {
    // State to show Question, shows StartScreen on State zero
    // const [question, setQuestion] = useState(-1)
    const question = useRef(-1)
    const [undo, setUndo] = useState(-1)
    const [eyetrackerConnected, setEyetrackerConnected] = useState(false)

    const [gazeObj, setGazeObj] = useState({ gaze_x: 0, gaze_y: 0 })
    const router = useRouter()
    const pid = router.query.pid || ''
    const idForQuestion = pid.split('_')[1] % 3

    // State for Question undo
    const [condition, setCondition] = useState('0')

    const answerselected = useRef("")
    const logselected_gaze = useRef({})
    const logselected_label = useRef({})
    const calibrationDone = useRef(false)
    const firstRenderRef = useRef(true);

    // This attribute is set to true if an answer was selected
    const answerOne = useRef(false)
    const answerTwo = useRef(false)
    const answerThree = useRef(false)

    // x and y coordinates of gaze
    var gaze_x
    var gaze_y
    var gaze_time

    // correlations of labels
    const cor_selected = useRef()
    const [corAnswerOne, setCorAnswerOne] = useState(0)
    const [corAnswerTwo, setCorAnswerTwo] = useState(0)
    const [corAnswerThree, setCorAnswerThree] = useState(0)

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

    const handleShow1 = () => {
        this.setState({
            show1: true
        })

        setTimeout(() => {
            this.setState({
                show1: false
            })
        }, 2000)
    }

    useEffect(() => {
        // for dev
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }
        const socketInitializer = async () => {
            console.log('init socket')
            await fetch('/api/socket');
            socket = io()
            if (socket) {
                socket.on('connect', () => {
                    console.log('connected')
                })

                socket.on('update-screen', msg => {
                    console.log('update screen', msg)
                    nextQuestion()
                })

                socket.on('update-gaze-position', obj => {
                    gaze_x = obj.gaze_x
                    gaze_y = obj.gaze_y
                    if (question.current > 0 && question.current < 10) {
                        _calculateCorrelation()
                    }
                })

                socket.on('update-eyetracker-connection', msg => {
                    console.log('Connection received', msg)
                    setEyetrackerConnected(msg)
                })
            }

        }
        socketInitializer()

    }, [])

    const handleAnswerRecived = async (msg) => {
        //Undo page
        // Question page
        switch (msg) {
            case 'answerOne':
                answerOne.current = true
                cor_selected.current = corAnswerOne
                logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
                logselected_label.current = { label_x: logLabelPositionOne_x, label_y: logLabelPositionOne_y, label_time: logGazeTime }
                logData()
                // corAnswerOne = 0;

                break;

            case 'answerTwo':
                answerTwo.current = true;
                cor_selected.current = corAnswerTwo
                logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
                logselected_label.current = { label_x: logLabelPositionTwo_x, label_y: logLabelPositionTwo_y, label_time: logGazeTime }
                // corAnswerTwo = 0;
                logData()

                break;

            case 'answerThree':
                answerThree.current = true;
                cor_selected.current = corAnswerThree
                logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
                logselected_label.current = { label_x: logLabelPositionTwo_x, label_y: logLabelPositionTwo_y, label_time: logGazeTime }
                // corAnswerThree = 0;
                logData()

                break;

        }
        console.log('question no. ', question.current, ' got : ', msg)
        await sleep(2000)
        nextQuestion()

        // setTimeout(function () {
        // }, 1000);
    }

    // Conditional Question State control
    const questionNumber = () => {
        // console.log('queetion no', question)
        if (question.current === 0) {
            return <SecondScreen header="GazeCast" />
        }
        // else if (question.current > 11) {
        //     return <AccuracyTest id={id.current} />
        // }
        else if (question.current > 0 && question.current < 10) {
            return (QuestionScreen(questionArray[idForQuestion][question.current]));
        } else if (question.current >= 10) {
            calibrationDone.current = false
            return (
                <StudyEnd />
            )
        } else {
            return <StartScreen header="GazeCast" />
        }
    }

    // Function on clicking Start button
    function start() {
        //add start timestamp
        // pid
        // db.collection("studyfiles").doc(id.current).update({
        //     start_time: firebase.firestore.Timestamp.now()
        // }
        // )
    }

    // Handle Gaze results
    function PlotGaze(result) {
        gaze_x = result.docX;
        gaze_y = result.docY;
        gaze_time = result.time;
        Correlation(gaze_x, gaze_y, gaze_time)
    }

    const nextQuestion = () => {
        // setQuestion(question + 1)
        question.current = question.current + 1
        socket.emit('question-change', question.current)
        setUndo(question.current)
    }

    // calculates Correlation
    function _calculateCorrelation() {
        // const { answerOne_x, answerOne_y, answerTwo_x, answerTwo_y, answerThree_x, answerThree_y } = obj
        //if gaze x and gaze y have value
        console.log(gaze_x, gaze_y)
        if (gaze_x && gaze_y && question.current > 0) {
            let answerOne_rect = document.getElementById('answerOne').getBoundingClientRect();
            let answerTwo_rect = document.getElementById('answerTwo').getBoundingClientRect();
            let answerThree_rect = document.getElementById('answerThree').getBoundingClientRect();

            // Labels
            // x and y coordinates of labels
            let answerOne_x = answerOne_rect.left;
            let answerOne_y = answerOne_rect.top;
            let answerTwo_x = answerTwo_rect.left;
            let answerTwo_y = answerTwo_rect.top;
            let answerThree_x = answerThree_rect.left;
            let answerThree_y = answerThree_rect.top;

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
            logGazeTime.push(gaze_time)

            // calculate the correlation
            let corAnswerOne_x = calculateCorrelation(logLabelPositionOne_x, logGazePosition_x);
            let corAnswerOne_y = calculateCorrelation(logLabelPositionOne_y, logGazePosition_y);
            let corAnswerTwo_x = calculateCorrelation(logLabelPositionTwo_x, logGazePosition_x);
            let corAnswerTwo_y = calculateCorrelation(logLabelPositionTwo_y, logGazePosition_y);
            let corAnswerThree_x = calculateCorrelation(logLabelPositionThree_x, logGazePosition_x);
            let corAnswerThree_y = calculateCorrelation(logLabelPositionThree_y, logGazePosition_y);

            // calculate correlation
            let temp_corAnswerOne = corAnswerOne_x < corAnswerOne_y ? corAnswerOne_x : corAnswerOne_y;
            let temp_corAnswerTwo = corAnswerTwo_x < corAnswerTwo_y ? corAnswerTwo_x : corAnswerTwo_y;
            let temp_corAnswerThree = corAnswerThree_x < corAnswerThree_y ? corAnswerThree_x : corAnswerThree_y;

            console.log(temp_corAnswerOne, temp_corAnswerTwo, temp_corAnswerThree)
            setCorAnswerOne(isNaN(temp_corAnswerOne) ? corAnswerOne : temp_corAnswerOne)
            setCorAnswerTwo(isNaN(temp_corAnswerTwo) ? corAnswerTwo : temp_corAnswerTwo)
            setCorAnswerThree(isNaN(temp_corAnswerThree) ? corAnswerThree : temp_corAnswerThree)

            if (((temp_corAnswerOne) > THRESHOLD) && (temp_corAnswerOne > temp_corAnswerTwo) && (temp_corAnswerOne > temp_corAnswerThree)) {
                handleAnswerRecived('answerOne')
                empty()
            } else if (((temp_corAnswerTwo) > THRESHOLD) && (temp_corAnswerTwo > temp_corAnswerOne) && (temp_corAnswerTwo > temp_corAnswerThree)) {
                handleAnswerRecived('answerTwo')

                empty()
            } else if (((temp_corAnswerThree) > THRESHOLD) && (temp_corAnswerThree > temp_corAnswerOne) && (temp_corAnswerThree > temp_corAnswerTwo)) {
                handleAnswerRecived('answerThree')
                empty()
            }


            /// clear array
            if (logLabelPositionOne_x.length > 30) {
                handleAnswerRecived('Not Detect')
                empty()
            }

        }
    }

    // log data into firestore
    function logData() {
        // if (question < 10) {
        //     db.collection("studyfiles").doc(id.current).set({
        //         question_data: {
        //             [`question_${question.current}`]: { answerselected: answerselected.current, gaze: logselected_gaze.current, label: logselected_label.current, correlation: cor_selected.current }
        //         }
        //     }, { merge: true })
        // }
        // if (question === 10) {
        //     db.collection("studyfiles").doc(id.current).set({
        //         question_data: {
        //             question_10: { number: question.current, answerselected: answerselected.current, gaze: logselected_gaze.current, label: logselected_label.current, correlation: cor_selected.current }
        //         },
        //         window_height: window.innerHeight,
        //         window_width: window.innerWidth,
        //         end_time: firebase.firestore.Timestamp.now()
        //     }, { merge: true })
        // }
    }

    // empty arrays
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

    function sleep(duration) {
        return new Promise((resolve) => {
            setTimeout(resolve, duration)
        })
    }

    // First screen 
    const StartScreen = (props) => {
        return (
            <div className='Eyevote' style={{ overflow: 'scroll' }}>
                {/* <label className='answerOne' id="answerOne"> </label>
                <label className='answerTwo' id="answerTwo"> </label>
                <label className='answerThree' id="answerThree"> </label> */}

                <div className="descriptionBox">
                    <h1 className='titleEyeVote'>{props.header}</h1>
                    <h3 className='instructions'>Paricipant id: {pid}</h3>
                    <p className='question_title white'>Choose Condition</p>
                    <label className='white radio_op'><input type="radio" value={WEBCAMERA} name="condition" checked={condition === WEBCAMERA} onChange={(e) => setCondition(WEBCAMERA)} /> Web camera</label> <p />
                    <label className='white radio_op'><input type="radio" value={MOBILE_WITH_STAND} name="condition" checked={condition === MOBILE_WITH_STAND} onChange={(e) => setCondition(MOBILE_WITH_STAND)} /> Mobile with fixed stand</label><p />
                    <label className='white radio_op'><input type="radio" value={MOBILE_WITH_HAND} name="condition" checked={condition === MOBILE_WITH_HAND} onChange={(e) => setCondition(MOBILE_WITH_HAND)} /> Mobile with hand</label><p />
                    {/* <h4 className='instructions marginTop'>The study will start with a calibration.</h4> */}
                    {!WEBCAMERA &&
                        <>
                            <h6 className='instructions'>Please use mobile to scan the QR code below.</h6>
                            <div className="boxCenter">
                                <Image
                                    //   loader={myLoader}
                                    src="/qrcode.png"
                                    alt="QR code to mobile eye tracker"
                                    width={400}
                                    height={400}
                                />
                                <h4 className='instructions'>Please click "NEXT" button on mobile if ready.</h4>
                            </div>
                        </>
                    }
                    <br />
                    <div className="boxCenter">
                        <button className='button' onClick={() => {
                            // start(); 
                            nextQuestion()
                        }}>
                            Next
                        </button>
                    </div>
                </div >
            </div >
        );
    }

    // Second screen 
    const SecondScreen = (props) => {
        return (
            <div className='Eyevote'>
                <label className='answerOne' id="answerOne"> </label>
                <label className='answerTwo' id="answerTwo"> </label>
                <label className='answerThree' id="answerThree"> </label>
                <div className="descriptionBox">
                    <h1 className='titleEyeVote'>{props.header}</h1>
                    <h4 className='instructions marginTop'>You will be asked 10 questions now.</h4>
                    {/* <h4 className='instructions'>Select an answer by following its movement with your gaze.</h4> */}
                    <h6 className='instructions'>{`Eye-tracker status: `}
                        <span className={eyetrackerConnected ? 'green' : 'red'}>
                            {eyetrackerConnected ? 'Connected' : 'Not Connected'}
                        </span>
                    </h6>
                    {eyetrackerConnected && <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => {
                            nextQuestion(); calibrationDone.current = true;
                            // start()
                        }}>
                            Start
                        </button>
                    </div>}
                </div>
            </div>
        );
    }

    // Question screen
    const QuestionScreen = ({ one = false, two = false, three = false }) => {
        return (
            <div className='Eyevote'>
                <div className={`answerOne ${one && 'select'}`} id="answerOne" >{(corAnswerOne).toFixed(2)}</div>
                <div className={`answerTwo ${two && 'select'}`} id="answerTwo" >{(corAnswerTwo).toFixed(2)}</div>
                <div className={`answerThree ${three && 'select'}`} id="answerThree" >{(corAnswerThree).toFixed(2)}</div>
            </div>
        );
    }

    const StudyEnd = (props) => {
        return (
            <div className='Eyevote'>
                <label className='answerOne' id="answerOne"> </label>
                <label className='answerTwo' id="answerTwo"> </label>
                <label className='answerThree' id="answerThree"> </label>
                <div className="descriptionBox">
                    <h4 className='instructions'>You have successfully answered all questions.</h4>
                    <h4 className='instructions'>We will now continue with the accuracy test.</h4>
                    <p className='instructions'>Please look at the black center inside the white circles showing up on the screen.</p>
                    <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => { nextQuestion(); }}>
                            Okay
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {questionNumber()}
        </div>
    )
}

export default EyeVote