import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { db } from '../../firebase';
import { doc, collection, setDoc, addDoc, Timestamp } from "firebase/firestore";

// import the fn for correlation
import calculateCorrelation from "calculate-correlation"

import io from 'socket.io-client'
import { useRouter } from 'next/router'

const WINDOW_SIZE = 1000 // 1 second
const THRESHOLD = 0.8
const SIZE_OF_ARR = 30

const WEBCAMERA = 'WEBCAMERA'
const MOBILE_WITH_HAND = 'MOBILE_WITH_HAND'
const MOBILE_WITH_STAND = 'MOBILE_WITH_STAND'

const ONE = "ONE"
const TWO = "TWO"
const THREE = "THREE"
const NOT_DETECT = "NOT_DETECT"

// const questionArray = [{
//     1: CIRCULAR,
//     2: ZIGZAG,
//     3: DIAGONAL,
//     4: DIAGONAL,
//     5: CIRCULAR,
//     6: ZIGZAG,
//     7: ZIGZAG,
//     8: DIAGONAL,
//     9: CIRCULAR,
// },
// {
//     1: ZIGZAG,
//     2: DIAGONAL,
//     3: CIRCULAR,
//     4: CIRCULAR,
//     5: ZIGZAG,
//     6: DIAGONAL,
//     7: DIAGONAL,
//     8: CIRCULAR,
//     9: ZIGZAG,
// },
// {
//     1: DIAGONAL,
//     2: CIRCULAR,
//     3: ZIGZAG,
//     4: ZIGZAG,
//     5: DIAGONAL,
//     6: CIRCULAR,
//     7: CIRCULAR,
//     8: ZIGZAG,
//     9: DIAGONAL,
// },]

const questionArray = [{
    // 1: { prompt: "Find the PINK potatoe!", one: "brown_1", two: "pink", three: "brown_3" },
    0: { prompt: "(Training)", one: "brown", two: "brown", three: "pink" },
    1: { prompt: "(1)", one: "pink", two: "brown", three: "brown" },
    2: { prompt: "(2)", one: "brown", two: "pink", three: "brown" },
    3: { prompt: "(3)", one: "brown", two: "brown", three: "pink" },
    4: { prompt: "(4)", one: "brown", two: "pink", three: "brown" },
    5: { prompt: "(5)", one: "brown", two: "brown", three: "pink" },
    6: { prompt: "(6)", one: "pink", two: "brown", three: "brown" },
}]

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
    5: ONE,
    6: THREE,
}]


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

                socket.on('update-web-question', msg => {
                    console.log('update-question', msg)
                    // if (condition && pid) {
                    // conditionRef.current = condition
                    // participantRef.current = pid
                    // }
                    nextQuestion()
                })

                socket.on('update-gaze-position', obj => {
                    gaze_x = obj.gaze_x
                    gaze_y = obj.gaze_y
                    // console.log('x: ', gaze_x, '  y:', gaze_y)
                    if (question.current >= 0 && question.current <= 6 && !undoscreen.current) {
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



        //start log overall time

        console.log('w: ', window.innerWidth)
        console.log('h: ', window.innerHeight)

        setTimeout(function run() {
            // get the x and y coordinates of the labels and assign them

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

                logLabelPositionOne_x.push(answerOne_x)
                logLabelPositionOne_y.push(answerOne_y)
                logLabelPositionTwo_x.push(answerTwo_x)
                logLabelPositionTwo_y.push(answerTwo_y)
                logLabelPositionThree_x.push(answerThree_x)
                logLabelPositionThree_y.push(answerThree_y)
            }
            setTimeout(run, WINDOW_SIZE / 30); // To continue sending object postion
        }, WINDOW_SIZE / 30);
    }, [])

    useEffect(() => {
        conditionRef.current = condition
    }, [condition])

    const handleAnswerRecived = () => {
        // Question page
        setUndo('1')
        setTimeout(function () {
            //console.log("Timeout over")
            empty()
            undoscreen.current = false
            setUndo(0)
            nextQuestion()
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
            console.log('hi ', conditionRef.current, participantRef.current)
            const start_time = Timestamp.now()
            setDoc(dataRef, {
                start_time,
                timestamp: start_time,
                start_time_UNIX: start_time.toMillis(),
                timestamp_UNIX: start_time.toMillis(),
            }, { merge: true })
            interactionTime.current = start_time.toMillis()
        }
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

    // calculates Correlation
    function _calculateCorrelation() {
        //if gaze x and gaze y have value
        if ((!undoscreen.current) && question.current >= 0) {
            //check change ans
            let isChangeAns = false

            // push gaze data into the arrays
            logGazePosition_x.push(...gaze_x)
            logGazePosition_y.push(...gaze_y)
            // push label positions into the arrays
            logGazeTime.push(Timestamp.now())

            console.log(logLabelPositionOne_x.length, logGazePosition_x.length)

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

                    const logData = {
                        participantId: participantRef.current,
                        questionNo: question.current,
                        condition: conditionRef.current,
                        // gaze_x,
                        // gaze_y,
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
                        mode: question.current === 0 ? "TRAINING" : "REAL",
                        target_to_select: CHOICE_TO_SELECT[questionSetNo.current][question.current],
                    }

                    //log end all questions
                    if (question.current === 6) {
                        const end_time = Timestamp.now()
                        logData.end_time = end_time
                        logData.end_time_UNIX = end_time.toMillis()
                        logData.interaction_time = end_time.toMillis - interactionTime.current
                        logData.window_height = window.innerHeight
                        logData.window_width = window.innerWidth

                    }

                    if ((temp_corAnswerOne >= THRESHOLD) && (temp_corAnswerOne > temp_corAnswerTwo) && (temp_corAnswerOne > temp_corAnswerThree)) {
                        logData.selected_answer = ONE
                        logData.select_status = CHOICE_TO_SELECT[questionSetNo.current][question.current] === ONE ? 'CORRECT' : "WRONG"
                        logData.selected_cor = temp_corAnswerOne
                        logData.selected_at = Timestamp.now()
                        logData.selected_at_UNIX = Timestamp.now().toMillis()
                        logData.duration = logData.selected_at_UNIX - durationPerQuestion.current
                        isChangeAns = true
                        answerselected.current = CHOICE_TO_SELECT[questionSetNo.current][question.current] === ONE ? 'PINK' : 'BROWN'
                        console.log(logData.selected_answer)

                    } else if ((temp_corAnswerTwo >= THRESHOLD) && (temp_corAnswerTwo > temp_corAnswerOne) && (temp_corAnswerTwo > temp_corAnswerThree)) {
                        logData.selected_answer = TWO
                        logData.select_status = CHOICE_TO_SELECT[questionSetNo.current][question.current] === TWO ? 'CORRECT' : "WRONG"
                        logData.selected_cor = temp_corAnswerTwo
                        logData.selected_at = Timestamp.now()
                        logData.selected_at_UNIX = Timestamp.now().toMillis()
                        logData.duration = logData.selected_at_UNIX - durationPerQuestion.current
                        isChangeAns = true
                        answerselected.current = CHOICE_TO_SELECT[questionSetNo.current][question.current] === TWO ? 'PINK' : 'BROWN'
                        console.log(logData.selected_answer)

                    } else if ((temp_corAnswerThree >= THRESHOLD) && (temp_corAnswerThree > temp_corAnswerOne) && (temp_corAnswerThree > temp_corAnswerTwo)) {
                        logData.selected_answer = THREE
                        logData.select_status = CHOICE_TO_SELECT[questionSetNo.current][question.current] === THREE ? 'CORRECT' : "WRONG"
                        logData.selected_cor = temp_corAnswerThree
                        logData.selected_at = Timestamp.now()
                        logData.selected_at_UNIX = Timestamp.now().toMillis()
                        logData.duration = logData.selected_at_UNIX - durationPerQuestion.current
                        isChangeAns = true
                        answerselected.current = CHOICE_TO_SELECT[questionSetNo.current][question.current] === THREE ? 'PINK' : 'BROWN'
                        console.log(logData.selected_answer)
                    }


                    /// clear array : TIME OUT AFTER 30 seconds
                    if (logGazeTime.length > 30) {
                        logData.select_status = "TIME_OUT"
                        logData.select_status = NOT_DETECT
                        logData.selected_at = Timestamp.now()
                        logData.selected_at_UNIX = Timestamp.now().toMillis()
                        logData.duration = logData.selected_at_UNIX - durationPerQuestion.current
                        isChangeAns = true
                        answerselected.current = NOT_DETECT
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
        // durationPerQuestion = 0;
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
                    <label className='dimgray radio_op'><input type="radio" value={WEBCAMERA} name="condition" checked={condition === WEBCAMERA} onChange={(e) => {
                        setCondition(WEBCAMERA);
                        conditionRef.current = WEBCAMERA
                        start()
                    }} /> Web camera</label> <p />
                    <label className='dimgray radio_op'><input type="radio" value={MOBILE_WITH_STAND} name="condition" checked={condition === MOBILE_WITH_STAND} onChange={(e) => {
                        setCondition(MOBILE_WITH_STAND);
                        conditionRef.current = MOBILE_WITH_STAND
                        start()
                    }} /> Mobile with fixed stand</label><p />
                    <label className='dimgray radio_op'><input type="radio" value={MOBILE_WITH_HAND} name="condition" checked={condition === MOBILE_WITH_HAND} onChange={(e) => {
                        setCondition(MOBILE_WITH_HAND);
                        conditionRef.current = MOBILE_WITH_HAND
                        start()
                    }} /> Mobile with hand</label><p />
                    {/* <h4 className='instructions marginTop'>The study will start with a calibration.</h4> */}
                    {condition !== WEBCAMERA &&
                        <>
                            <p className='question_title'>Please use your mobile to scan the QR code below to connect with the screen.</p>
                            <div className="boxCenter">
                                <Image
                                    //   loader={myLoader}
                                    src="/qrcode.png"
                                    alt="QR code to mobile eye tracker"
                                    width={300}
                                    height={300}
                                />
                                <p className='question_title'>Please click "NEXT" button on mobile if ready.</p>
                            </div>
                        </>
                    }
                    <br />
                    <label className='answerOne' id="answerOne"> </label>
                    <label className='answerTwo' id="answerTwo"> </label>
                    <label className='answerThree' id="answerThree"> </label>
                    {condition === WEBCAMERA && <div className="boxCenter">
                        <button className='button' onClick={() => {
                            if (condition) {
                                // conditionRef.current = condition
                                // participantRef.current = pid
                                // start();
                                nextQuestion()
                            }
                        }}>
                            Next
                        </button>

                    </div>
                    }

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
                    <label className='answerOne' id="answerOne"> </label>
                    <label className='answerTwo' id="answerTwo"> </label>
                    <label className='answerThree' id="answerThree"> </label>
                    {/* < className='instructions'>Follow the circle by following its movement with your gaze.</h4> */}
                    <p className='instructions'>Find and follow the <span className='pink'>PINK</span> potato moving on the screen</p>
                    <Image
                        src={'/pink_cute.png'}
                        alt="Pink potato"
                        width={600}
                        height={250}
                    />

                    <p className='question_title dimgray'>{`Eye-tracker status: `}
                        <span className={eyetrackerConnected ? 'green' : 'red'}>
                            {eyetrackerConnected ? 'Connected' : 'Not Connected'}
                        </span>
                    </p>
                    {eyetrackerConnected && <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => {
                            nextQuestion(); calibrationDone.current = true;
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
                    <label className='answerOne' id="answerOne"> </label>
                    <label className='answerTwo' id="answerTwo"> </label>
                    <label className='answerThree' id="answerThree"> </label>
                </div>
            </div>
        );
    }

    const StudyEnd = (props) => {
        return (
            <div className='Eyevote'>
                <div className="descriptionBox">
                    <label className='answerOne' id="answerOne"> </label>
                    <label className='answerTwo' id="answerTwo"> </label>
                    <label className='answerThree' id="answerThree"> </label>
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