import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from "firebase/firestore";

// import the fn for correlation
import calculateCorrelation from "calculate-correlation"

import io from 'socket.io-client'
import { useRouter } from 'next/router'

const WINDOW_SIZE = 1000 // 1 second
const THRESHOLD = 0.8
const SIZE_OF_ARR = 60

const WEBCAMERA = 'WEBCAMERA'
const MOBILE_WITH_HAND = 'MOBILE_WITH_HAND'
const MOBILE_WITH_STAND = 'MOBILE_WITH_STAND'

const ONE = "ONE"
const TWO = "TWO"
const THREE = "THREE"
const NOT_DETECT = "NOT_DETECT"

const questionArray = [{
    0: { prompt: "(Training)", one: "brown", two: "brown", three: "pink" },
    1: { prompt: "(1)", one: "pink", two: "brown", three: "brown" },
    2: { prompt: "(2)", one: "brown", two: "pink", three: "brown" },
    3: { prompt: "(3)", one: "brown", two: "brown", three: "pink" },
    4: { prompt: "(4)", one: "brown", two: "pink", three: "brown" },
    5: { prompt: "(5)", one: "brown", two: "brown", three: "pink" },
    6: { prompt: "(6)", one: "pink", two: "brown", three: "brown" },
},
{
    0: { prompt: "(Training)", one: "pink", two: "brown", three: "brown" },
    1: { prompt: "(1)", one: "brown", two: "brown", three: "pink" },
    2: { prompt: "(2)", one: "brown", two: "pink", three: "brown" },
    3: { prompt: "(3)", one: "pink", two: "brown", three: "brown" },
    4: { prompt: "(4)", one: "brown", two: "brown", three: "pink" },
    5: { prompt: "(5)", one: "pink", two: "brown", three: "brown" },
    6: { prompt: "(6)", one: "brown", two: "pink", three: "brown" },
},
{
    0: { prompt: "(Training)", one: "brown", two: "pink", three: "brown" },
    1: { prompt: "(1)", one: "pink", two: "brown", three: "brown" },
    2: { prompt: "(2)", one: "brown", two: "brown", three: "pink" },
    3: { prompt: "(3)", one: "brown", two: "pink", three: "brown" },
    4: { prompt: "(4)", one: "pink", two: "brown", three: "brown" },
    5: { prompt: "(5)", one: "brown", two: "pink", three: "brown" },
    6: { prompt: "(6)", one: "brown", two: "brown", three: "pink" },
},
]

/*
1 = CIRCULAR
2 = ZIGZAG
3 = DIAGONAL
*/
const CHOICE_TO_SELECT = [{
    0: THREE,
    1: ONE,
    2: TWO,
    3: THREE,
    4: TWO,
    5: THREE,
    6: ONE,
}, {
    0: ONE,
    1: THREE,
    2: TWO,
    3: ONE,
    4: THREE,
    5: ONE,
    6: TWO,
}, {
    0: TWO,
    1: ONE,
    2: THREE,
    3: TWO,
    4: ONE,
    5: TWO,
    6: THREE,
},]


let socket

const EyeVote = (props) => {
    // State to show Question, shows StartScreen on State zero
    // const [question, setQuestion] = useState(-1)
    const question = useRef(-2)
    const conditionRef = useRef('')
    const undoscreen = useRef(false)

    const participantRef = useRef('')
    const questionSetNo = useRef(0)
    const durationPerQuestion = useRef(-1)
    const interactionTime = useRef(-1)
    const answerselected = useRef("")

    const [undo, setUndo] = useState(-1)
    const [eyetrackerConnected, setEyetrackerConnected] = useState(false)

    const router = useRouter()
    const pid = router.query.pid || ''

    // State for Question undo
    const [condition, setCondition] = useState(WEBCAMERA)

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
        questionSetNo.current = Math.floor(Math.random() * 3)
        const socketInitializer = async () => {
            console.log('init socket')
            await fetch('/api/socket');
            socket = io()
            if (socket) {
                socket.on('connect', () => {
                    console.log('connected')
                })

                socket.on('update-web-question', msg => {
                    console.log('update-question', msg)
                    // if (condition && pid) {
                    // conditionRef.current = condition
                    // }
                    nextQuestion()
                })

                socket.on('update-gaze-position', obj => {
                    gaze_x = obj.gaze_x
                    gaze_y = obj.gaze_y

                    if (document.getElementById('answerOne')) {
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
                    }
                })

                socket.on('update-eyetracker-connection', msg => {
                    console.log('Connection received', msg)
                    setEyetrackerConnected(msg)
                })
            }

        }
        socketInitializer()

        //start log overall time
        console.log('w: ', window.innerWidth)
        console.log('h: ', window.innerHeight)

        setTimeout(function run() {
            // get the x and y coordinates of the labels and assign them
            if (question.current >= 0 && question.current <= 6 && !undoscreen.current) {
                _calculateCorrelation()
            }

            setTimeout(run, WINDOW_SIZE); // To continue sending object postion
        }, WINDOW_SIZE);
    }, [])

    useEffect(() => {
        conditionRef.current = condition
        participantRef.current = pid
    }, [condition])

    const handleAnswerRecived = () => {
        // Question page
        setUndo('1')
        setTimeout(function () {
            undoscreen.current = false
            setUndo(0)
            nextQuestion()
            empty()
        }, 5000);
    }

    // Conditional Question State control
    const questionNumber = () => {
        if (question.current === -1) {
            return <SecondScreen header="GazeCast" />
        }
        else if (undo === '1') {
            // render the UndoScreen
            return (UndoScreen({ prompt: answerselected.current }));
        }
        // else if (question.current > 11) {
        //     return <AccuracyTest id={id.current} />
        // }
        else if (question.current >= 0 && question.current <= 6) {
            return (QuestionScreen(questionArray[questionSetNo.current][question.current]));
        } else if (question.current > 6) {
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
        // participantRef.current = pid

        const dataRef = collection(db, conditionRef.current)
        const start_time = Timestamp.now()
        const logData = {
            start_time,
            timestamp: start_time,
            start_time_UNIX: start_time.toMillis(),
            timestamp_UNIX: start_time.toMillis(),
            participantId: participantRef.current,

        }
        addDoc(dataRef, logData);
        console.log('hi ', conditionRef.current, participantRef.current)
        interactionTime.current = start_time.toMillis()
    }

    const nextQuestion = () => {
        // setQuestion(question + 1)
        question.current = question.current + 1
        socket.emit('question-change', question.current)
        if (question.current >= 0 && question.current <= 6) {
            console.log('in next question [', question.current, ']: ', CHOICE_TO_SELECT[questionSetNo.current][question.current])
            durationPerQuestion.current = Timestamp.now().toMillis()
        }
        setUndo(question.current + 100)

    }

    const handleCorrelationIsDetected = (ans, corData, target_to_select) => {
        let log = {}
        log.selected_answer = ans
        log.select_status = target_to_select === ans ? 'CORRECT' : "WRONG"
        log.selected_cor = corData
        log.selected_at = Timestamp.now()
        log.selected_at_UNIX = Timestamp.now().toMillis()
        log.duration = log.selected_at_UNIX - durationPerQuestion.current
        answerselected.current = target_to_select === ans ? 'PINK' : 'BROWN'
        console.log('ANS is : ', log.selected_answer)
        //log end all questions
        if (question.current === 6) {
            const end_time = Timestamp.now()
            log.end_time = end_time
            log.end_time_UNIX = end_time.toMillis()
            log.interaction_time = end_time.toMillis() - interactionTime.current
            log.window_height = window.innerHeight
            log.window_width = window.innerWidth
        }

        return log
    }

    // calculates Correlation
    function _calculateCorrelation() {

        if ((!undoscreen.current) && question.current >= 0 && logGazePosition_x.length >= SIZE_OF_ARR) {
            //check change ans
            let isChangeAns = false

            logGazeTime.push(Timestamp.now())

            if (logLabelPositionOne_x.length > SIZE_OF_ARR) {
                logLabelPositionOne_x = logLabelPositionOne_x.slice(logLabelPositionOne_x.length - SIZE_OF_ARR)
            }
            if (logLabelPositionOne_y.length > SIZE_OF_ARR) {
                logLabelPositionOne_y = logLabelPositionOne_y.slice(logLabelPositionOne_y.length - SIZE_OF_ARR)
            }
            if (logLabelPositionTwo_x.length > SIZE_OF_ARR) {
                logLabelPositionTwo_x = logLabelPositionTwo_x.slice(logLabelPositionTwo_x.length - SIZE_OF_ARR)
            }
            if (logLabelPositionTwo_y.length > SIZE_OF_ARR) {
                logLabelPositionTwo_y = logLabelPositionTwo_y.slice(logLabelPositionTwo_y.length - SIZE_OF_ARR)
            }
            if (logLabelPositionThree_x.length > SIZE_OF_ARR) {
                logLabelPositionThree_x = logLabelPositionThree_x.slice(logLabelPositionThree_x.length - SIZE_OF_ARR)
            }
            if (logLabelPositionThree_y.length > SIZE_OF_ARR) {
                logLabelPositionThree_y = logLabelPositionThree_y.slice(logLabelPositionThree_y.length - SIZE_OF_ARR)
            }
            if (logGazePosition_x.length > SIZE_OF_ARR) {
                logGazePosition_x = logGazePosition_x.slice(logGazePosition_x.length - SIZE_OF_ARR)
            }
            if (logGazePosition_y.length > SIZE_OF_ARR) {
                logGazePosition_y = logGazePosition_y.slice(logGazePosition_y.length - SIZE_OF_ARR)
            }

            if (logGazePosition_x.length === SIZE_OF_ARR && logLabelPositionOne_x.length === SIZE_OF_ARR) {
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

                if (!(isNaN(temp_corAnswerOne) || isNaN(temp_corAnswerTwo) || isNaN(temp_corAnswerThree))) {
                    console.log(temp_corAnswerOne, temp_corAnswerTwo, temp_corAnswerThree)
                    const dataRef = collection(db, conditionRef.current)
                    setCorAnswerOne(isNaN(temp_corAnswerOne) ? corAnswerOne : temp_corAnswerOne)
                    setCorAnswerTwo(isNaN(temp_corAnswerTwo) ? corAnswerTwo : temp_corAnswerTwo)
                    setCorAnswerThree(isNaN(temp_corAnswerThree) ? corAnswerThree : temp_corAnswerThree)

                    const questionNo = question.current
                    const target_to_select = CHOICE_TO_SELECT[questionSetNo.current][questionNo]

                    const logData = {
                        participantId: participantRef.current,
                        questionNo,
                        condition: conditionRef.current,
                        gaze_x,
                        gaze_y,
                        timestamp: Timestamp.now(),
                        timestamp_UNIX: Timestamp.now().toMillis(),
                        // obj_one_x: answerOne_x,
                        // obj_one_y: answerOne_y,
                        // obj_two_x: answerTwo_x,
                        // obj_two_y: answerTwo_y,
                        // obj_three_x: answerThree_x,
                        // obj_three_y: answerThree_y,
                        cor_one: temp_corAnswerOne,
                        cor_two: temp_corAnswerTwo,
                        cor_three: temp_corAnswerThree,
                        mode: questionNo === 0 ? "TRAINING" : "REAL",
                        target_to_select,
                    }

                    if ((temp_corAnswerOne >= THRESHOLD) && (temp_corAnswerOne > temp_corAnswerTwo) && (temp_corAnswerOne > temp_corAnswerThree)) {
                        logData = { ...logData, ...handleCorrelationIsDetected(ONE, temp_corAnswerOne, target_to_select) }
                        isChangeAns = true

                    } else if ((temp_corAnswerTwo >= THRESHOLD) && (temp_corAnswerTwo > temp_corAnswerOne) && (temp_corAnswerTwo > temp_corAnswerThree)) {
                        logData = { ...logData, ...handleCorrelationIsDetected(TWO, temp_corAnswerTwo, target_to_select) }
                        isChangeAns = true

                    } else if ((temp_corAnswerThree >= THRESHOLD) && (temp_corAnswerThree > temp_corAnswerOne) && (temp_corAnswerThree > temp_corAnswerTwo)) {
                        logData = { ...logData, ...handleCorrelationIsDetected(THREE, temp_corAnswerThree, target_to_select) }
                        isChangeAns = true
                    }

                    /// clear array : TIME OUT AFTER 30 seconds
                    if (!isChangeAns && logGazeTime.length > 30) {
                        logData = { ...logData, ...handleCorrelationIsDetected(NOT_DETECT, NaN, target_to_select) }
                        answerselected.current = NOT_DETECT
                        logData.select_status = NOT_DETECT
                        isChangeAns = true
                    }

                    // log data into firestore
                    addDoc(dataRef, logData);

                    if (isChangeAns) {
                        undoscreen.current = true
                        handleAnswerRecived()
                    }
                }
            }
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
                    {/* <h3 className='instructions'>Paricipant id: {pid}</h3> */}
                    <p className='question_title dimgray'>There will be one trial round, followed by six rounds of experimentation.</p>
                    <br />
                    <p className='question_title dimgray'>Choose Eye-tracker *</p>
                    <label className='dimgray radio_op'>
                        <input type="radio"
                            value={WEBCAMERA}
                            name="condition"
                            checked={condition === WEBCAMERA}
                            onChange={() => setCondition(WEBCAMERA)} />
                        Web camera
                    </label>
                    <p />
                    <label className='dimgray radio_op'>
                        <input type="radio"
                            value={MOBILE_WITH_STAND}
                            name="condition"
                            checked={condition === MOBILE_WITH_STAND}
                            onChange={() => setCondition(MOBILE_WITH_STAND)} />
                        Mobile with fixed stand</label>
                    <p />
                    <label className='dimgray radio_op'>
                        <input type="radio"
                            value={MOBILE_WITH_HAND}
                            name="condition"
                            checked={condition === MOBILE_WITH_HAND}
                            onChange={() => setCondition(MOBILE_WITH_HAND)} />
                        Mobile with hand
                    </label>
                    <p />

                    <br />

                    <div className="boxCenter">
                        <button className='button' onClick={() => {
                            nextQuestion()
                            start()
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
                <div className="descriptionBox boxCenter">
                    <h1 className='titleEyeVote'>{props.header}</h1>
                    {condition !== WEBCAMERA &&
                        <>
                            <p className='instructions'>Please use your mobile to scan the QR code below to connect the eye-tracker with the screen.
                            </p>

                            <div className="boxCenter">
                                <Image
                                    src="/qrcode.png"
                                    alt="QR code to mobile eye tracker"
                                    width={300}
                                    height={300}
                                />
                            </div>
                        </>
                    }
                    {/* < className='instructions'>Follow the circle by following its movement with your gaze.</h4> */}
                    <p className='instructions'>Find and follow the <span className='pink'>PINK</span> potato(
                        <Image
                            src={'/pink_cute.png'}
                            alt="Pink potato"
                            width={100}
                            height={50}
                        />
                        )moving on the screen</p>

                    <div className='question_title dimgray'>{`Eye-tracker status: `}
                        <span className={eyetrackerConnected ? 'green' : 'red'}>
                            {eyetrackerConnected ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>

                    {condition !== WEBCAMERA &&
                        <p className='question_title'>Please click "Start" button on mobile if ready.</p>
                    }
                    {(eyetrackerConnected && condition === WEBCAMERA) && <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => {
                            nextQuestion();
                        }}>
                            Start
                        </button>
                    </div>}
                </div>
            </div >
        );
    }

    // Question screen
    const QuestionScreen = (props) => {
        // answerProp.current = { one: props.one, two: props.two, three: props.three }

        const one = props.one === 'pink'
        const two = props.two === 'pink'
        const three = props.three === 'pink'

        return (
            <div className='Eyevote'>
                <h1 className='question' id="questionPrompt">Find the <span className='pink'>PINK</span> potato! {props.prompt}</h1>

                <div className={`answerOne`} id="answerOne">
                    <Image
                        src={one ? `/pink_${question.current}.png` : '/brown_1.png'}
                        alt="Answer 1"
                        layout='fill'
                    /></div>
                <div className={`answerTwo`} id="answerTwo" >
                    <Image
                        src={two ? `/pink_${question.current}.png` : '/brown_2.png'}
                        alt="Answer 2"
                        layout='fill'
                    /></div>
                <div className={`answerThree`} id="answerThree" >
                    <Image
                        src={three ? `/pink_${question.current}.png` : '/brown_3.png'}
                        alt="Answer 3"
                        layout='fill'
                    /></div>
            </div >
        );
    }

    const UndoScreen = (props) => {
        return (
            <div className='Eyevote'>
                <div className="descriptionBox boxCenter">

                    {NOT_DETECT === props.prompt ?
                        <h1 className='instructions'>
                            The movement cannot be detected!
                        </h1>
                        : <h1 className='instructions'>
                            {`You did select a `}
                            <span className={props.prompt === "PINK" ? 'pink' : 'brown'}>{props.prompt}</span>
                            {` potato!`}
                        </h1>}

                    <p> The next task will be shown in 5 seconds </p>

                </div>
            </div>
        );
    }

    const StudyEnd = (props) => {
        return (
            <div className='Eyevote'>
                <div className="descriptionBox">
                    <h4 className='instructions'>You have successfully completed this task.</h4>
                    <h4 className='instructions'>Thank you!</h4>
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