import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { db } from '../../firebase';
import { doc, collection, setDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";

// import the fn for correlation
import calculateCorrelation from "calculate-correlation"

import io from 'socket.io-client'
import { useRouter } from 'next/router'

const WINDOW_SIZE = 2000 // 2 second
const THRESHOLD = 0.7

const WEBCAMERA = 'WEBCAMERA'
const MOBILE_WITH_HAND = 'MOBILE_WITH_HAND'
const MOBILE_WITH_STAND = 'MOBILE_WITH_STAND'

const CIRCULAR = "CIRCULAR"
const ZIGZAG = "ZIGZAG"
const DIAGONAL = "DIAGONAL"
const NOT_DETECT = "NOT_DETECT"

const questionArray = [{
    1: CIRCULAR,
    2: ZIGZAG,
    3: DIAGONAL,
    4: DIAGONAL,
    5: CIRCULAR,
    6: ZIGZAG,
    7: ZIGZAG,
    8: DIAGONAL,
    9: CIRCULAR,
},
{
    1: ZIGZAG,
    2: DIAGONAL,
    3: CIRCULAR,
    4: CIRCULAR,
    5: ZIGZAG,
    6: DIAGONAL,
    7: DIAGONAL,
    8: CIRCULAR,
    9: ZIGZAG,
},
{
    1: DIAGONAL,
    2: CIRCULAR,
    3: ZIGZAG,
    4: ZIGZAG,
    5: DIAGONAL,
    6: CIRCULAR,
    7: CIRCULAR,
    8: ZIGZAG,
    9: DIAGONAL,
},]


let socket

const EyeVote = (props) => {
    // State to show Question, shows StartScreen on State zero
    // const [question, setQuestion] = useState(-1)
    const question = useRef(-1)
    const conditionRef = useRef('')
    const participantRef = useRef('')
    const questionSetNo = useRef('')

    const [undo, setUndo] = useState(-1)
    const [eyetrackerConnected, setEyetrackerConnected] = useState(false)

    const router = useRouter()
    const pid = router.query.pid || ''

    // State for Question undo
    const [condition, setCondition] = useState('')

    const logselected_gaze = useRef({})
    const calibrationDone = useRef(false)
    const firstRenderRef = useRef(true);

    // x and y coordinates of gaze
    var gaze_x
    var gaze_y

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

    useEffect(() => {
        // for dev
        // if (firstRenderRef.current) {
        //     firstRenderRef.current = false;
        //     return;
        // }
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

    const handleAnswerRecived = async (msg, corData) => {
        // Question page
        logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
        cor_selected.current = corData
        await logSubmitData(msg)

        console.log('question no. ', question.current, ' got : ', msg)
        empty()
        nextQuestion()
    }

    // Conditional Question State control
    const questionNumber = () => {
        if (question.current === 0) {
            return <SecondScreen header="GazeCast" />
        }
        // else if (question.current > 11) {
        //     return <AccuracyTest id={id.current} />
        // }
        else if (question.current > 0 && question.current < 10) {
            return (QuestionScreen(questionArray[questionSetNo.current][question.current]));
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
        // add start timestamp
        if (condition && pid) {
            const dataRef = doc(db, conditionRef.current, participantRef.current)
            setDoc(dataRef, {
                start_time: Timestamp.now(),
                start_time_UNIX: Timestamp.now().toMillis(),
            }, { merge: true })
        }
    }

    // Handle Gaze results
    function PlotGaze(result) {
        gaze_x = result.docX;
        gaze_y = result.docY;
        gaze_time = result.time;
        // Correlation(gaze_x, gaze_y, gaze_time)
    }

    const nextQuestion = () => {
        // setQuestion(question + 1)
        question.current = question.current + 1
        socket.emit('question-change', question.current)
        if (question.current > 0 && question.current < 10) {
            // const dataRef = doc(db, condition, pid)
            console.log('in next question [', question.current, ']: ', questionArray[questionSetNo.current][question.current])
            const dataRef = doc(db, conditionRef.current, participantRef.current)
            setDoc(dataRef, {
                question_data: {
                    [`question_${question.current}`]: {
                        start_time: Timestamp.now(),
                        start_time_UNIX: Timestamp.now().toMillis(),
                        to_select: questionArray[questionSetNo.current][question.current]
                    },
                },
            }, { merge: true })
        }
        setUndo(question.current)

    }

    // calculates Correlation
    function _calculateCorrelation() {
        //if gaze x and gaze y have value
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
            logGazeTime.push(Timestamp.now())

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
            // if(!isNaN(temp_corAnswerOne) && !isNaN(temp_corAnswerTwo) && !isNaN(temp_corAnswerT) )
            // console.log(condition, conditionRef.current, 'wefsd', participantRef)
            if (conditionRef.current && participantRef.current) {

                const dataRef = doc(db, conditionRef.current, participantRef.current)
                setDoc(dataRef, {
                    question_data: {
                        [`question_${question.current}`]: {
                            log: arrayUnion({
                                timestamp: Timestamp.now(),
                                timestamp_UNIX: Timestamp.now().toMillis(),
                                gaze_x,
                                gaze_y,
                                obj_one_x: answerOne_x,
                                obj_one_y: answerOne_y,
                                obj_two_x: answerTwo_x,
                                obj_two_y: answerTwo_y,
                                obj_three_x: answerThree_x,
                                obj_three_y: answerThree_y,
                                cor_one: temp_corAnswerOne,
                                cor_two: temp_corAnswerTwo,
                                cor_three: temp_corAnswerThree,
                                arr_length: logLabelPositionOne_x.length
                            })
                        }
                    }
                }, { merge: true });
            }
            if (logLabelPositionOne_x.length > 2) {
                if (((temp_corAnswerOne) > THRESHOLD) && (temp_corAnswerOne < 1) && (temp_corAnswerOne > temp_corAnswerTwo) && (temp_corAnswerOne > temp_corAnswerThree)) {
                    handleAnswerRecived(CIRCULAR, temp_corAnswerOne)
                } else if (((temp_corAnswerTwo) > THRESHOLD) && (temp_corAnswerTwo < 1) && (temp_corAnswerTwo > temp_corAnswerOne) && (temp_corAnswerTwo > temp_corAnswerThree)) {
                    handleAnswerRecived(ZIGZAG, temp_corAnswerTwo)
                } else if (((temp_corAnswerThree) > THRESHOLD) && (temp_corAnswerThree < 1) && (temp_corAnswerThree > temp_corAnswerOne) && (temp_corAnswerThree > temp_corAnswerTwo)) {
                    handleAnswerRecived(DIAGONAL, temp_corAnswerThree)
                }
            }



            /// clear array
            if (logLabelPositionOne_x.length > 30) {
                handleAnswerRecived(NOT_DETECT, -1)
            }

        }
    }

    // log data into firestore

    async function logSubmitData(selected_ans) {
        // const dataRef = doc(db, condition, pid)
        const dataRef = doc(db, conditionRef.current, participantRef.current)
        console.log('in log [', question.current, '] :', conditionRef.current, participantRef.current)
        if (question.current < 9) {
            await setDoc(dataRef, {
                question_data: {
                    [`question_${question.current}`]: {
                        answerselected: selected_ans,
                        selected_at_gaze: logselected_gaze.current,
                        selected_correlation: cor_selected.current,
                        end_time: Timestamp.now(),
                        end_time_UNIX: Timestamp.now().toMillis()
                    }
                }
            }, { merge: true })
        } else if (question.current >= 9) {
            await setDoc(dataRef, {
                question_data: {
                    question_9: {
                        answerselected: selected_ans,
                        selected_at_gaze: logselected_gaze.current,
                        selected_correlation: cor_selected.current,
                        end_time: Timestamp.now(),
                        end_time_UNIX: Timestamp.now().toMillis()
                    }
                },
                window_height: window.innerHeight,
                window_width: window.innerWidth,
                end_time: Timestamp.now(),
                end_time_UNIX: Timestamp.now().toMillis()
            }, { merge: true })
        }
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
                <div className="descriptionBox">
                    <h1 className='titleEyeVote'>{props.header}</h1>
                    <h3 className='instructions'>Paricipant id: {pid}</h3>
                    <p className='question_title white'>Choose Condition *</p>
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
                            if (condition) {
                                conditionRef.current = condition
                                participantRef.current = pid
                                questionSetNo.current = pid.split('_')[1] % 3
                                start();
                                nextQuestion()
                            }
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
                <div className="descriptionBox">
                    <h1 className='titleEyeVote'>{props.header}</h1>
                    <h4 className='instructions'>Follow the circle by following its movement with your gaze.</h4>
                    <h6 className='instructions'>{`Eye-tracker status: `}
                        <span className={eyetrackerConnected ? 'green' : 'red'}>
                            {eyetrackerConnected ? 'Connected' : 'Not Connected'}
                        </span>
                    </h6>
                    {eyetrackerConnected && <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => {
                            nextQuestion(); calibrationDone.current = true;
                        }}>
                            Start
                        </button>
                    </div>}
                </div>
            </div>
        );
    }

    // Question screen
    const QuestionScreen = (val) => {
        const one = val === CIRCULAR
        const two = val === ZIGZAG
        const three = val === DIAGONAL
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
                <div className="descriptionBox">
                    <h4 className='instructions'>You have successfully completed this task.</h4>
                    {/* <h4 className='instructions'>We will now continue with the accuracy test.</h4> */}
                    {/* <p className='instructions'>Please look at the black center inside the white circles showing up on the screen.</p> */}
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