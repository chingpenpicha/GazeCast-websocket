// import the fn for correlation
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import io from 'socket.io-client'

const questionArray = {
    // 1: { prompt: "1. 1+3 = ?", one: "2", two: "3", three: "4" },
    // 1: { prompt: "8. Which Superpower would you choose?", one: "Teleportation", two: "Read peoples mind", three: "Invisibility" },

    1: { prompt: "1. Is this your first time participating in an eyetracker study?", one: "Yes", two: "No", three: "I don't remember" },
    2: { prompt: "2. Do you prefer working/studying remotely or presence?", one: "Remotely", two: "Presence", three: "I dont mind" },
    3: { prompt: "3. Which movie genre do you like the most?", one: "Thriller", two: "Action", three: "Comedy" },
    4: { prompt: "4. Which social network do you use most often?", one: "Facebook", two: "Instagram", three: "Twitter" },
    5: { prompt: "5. Which beverage would you choose?", one: "Tea", two: "Coffee", three: "Water" },
    6: { prompt: "6. Which ice cream flavor would you choose?", one: "Vanilla", two: "Mango", three: "Chocolate" },
    7: { prompt: "7. How often do you shop online?", one: "Almost daily", two: "Often", three: "Rarely" },
    8: { prompt: "8. Which Superpower would you choose?", one: "Teleportation", two: "Read peoples mind", three: "Invisibility" },
    9: { prompt: "9. Where do you like to swim?", one: "Beach", two: "I don't like swimming", three: "Pool" },
    10: { prompt: "10. Which chewing gum flavor would you choose?", one: "Peppermint", two: "Bubble Gum", three: "Fruity" }
}

const WINDOW_SIZE = 2000 // 2 second

// const questionArray = {
//     1: { prompt: "1. Follow '1'", one: "1", two: "2", three: "3" },
//     2: { prompt: "2. Follow '2'", one: "1", two: "2", three: "3" },
//     3: { prompt: "3. Follow '3'", one: "1", two: "2", three: "3" },
//     4: { prompt: "4. Follow '2'", one: "1", two: "2", three: "3" },
//     5: { prompt: "5. Follow '3'", one: "1", two: "2", three: "3" },
//     6: { prompt: "6. Follow '1'", one: "1", two: "2", three: "3" },
//     7: { prompt: "7. Follow '3'", one: "1", two: "2", three: "3" },
//     8: { prompt: "8. Follow '1'", one: "1", two: "2", three: "3" },
//     9: { prompt: "9. Follow '2'", one: "1", two: "2", three: "3" },
//     10: { prompt: "10. Follow '1'", one: "1", two: "2", three: "3" },

// }


let socket

const EyeVote = (props) => {
    // State to show Question, shows StartScreen on State zero
    const question = useRef(-1)
    // const [socket, setSocket] = useState(undefined);

    // State for Question undo
    const [undo, setUndo] = useState('0')
    const undoscreen = useRef(false)
    const answerselected = useRef("")
    const logselected_gaze = useRef({})
    const logselected_label = useRef({})
    const calibrationDone = useRef(false)
    const firstRenderRef = useRef(true);

    //var
    // This attribute is set to true if an answer was selected
    const answerOne = useRef(false)
    const answerTwo = useRef(false)
    const answerThree = useRef(false)

    // values of the answers
    const answerProp = useRef({ one: "", two: "", three: "" });

    // x and y coordinates of gaze
    var gaze_x
    var gaze_y
    var gaze_time

    // correlations of labels
    var corAnswerOne
    var corAnswerTwo
    var corAnswerThree
    const cor_selected = useRef()

    //On Load 
    const id = useRef(props.id)
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
                    console.log(msg)
                    nextQuestion()
                    setUndo(msg + 3)
                })

                socket.on('update-answer', msg => {
                    console.log('answer received', msg)
                    handleAnswerRecived(msg)
                })
            }

        }
        socketInitializer()

        //continuing sending objet position
        setTimeout(function run() {
            // get the x and y coordinates of the labels and assign them
            if (question.current > 0) {
                let answerOne_rect = document.getElementById('answerOne').getBoundingClientRect();
                let answerTwo_rect = document.getElementById('answerTwo').getBoundingClientRect();
                let answerThree_rect = document.getElementById('answerThree').getBoundingClientRect();

                // calculate the center of Label position

                // Labels
                // x and y coordinates of labels
                let answerOne_x = answerOne_rect.left;
                let answerOne_y = answerOne_rect.top;
                let answerTwo_x = answerTwo_rect.left;
                let answerTwo_y = answerTwo_rect.top;
                let answerThree_x = answerThree_rect.left;
                let answerThree_y = answerThree_rect.top;
                const positionObj = { answerOne_x, answerOne_y, answerTwo_x, answerTwo_y, answerThree_x, answerThree_y }
                socket.emit('object-position-change', positionObj)
            }
            setTimeout(run, WINDOW_SIZE); // To continue sending object postion
        }, WINDOW_SIZE);
    }, [])

    const handleAnswerRecived = (msg) => {
        //Undo page
        if (undoscreen.current === true) {
            console.log('undo page')
            answerOne.current = false
            answerTwo.current = false
            answerThree.current = false

            switch (msg) {
                case 'answerOne':
                    corAnswerOne = 0
                    break;

                case 'answerTwo':
                case 'answerThree':
                    corAnswerThree = 0
                    nextQuestion()
                    logData();
                    break;
            }

            // empty()
            undoscreen.current = false
            // setTimeout(function () {
            setUndo('0')
            // }, 1000);

        } else {
            // Question page
            switch (msg) {
                case 'answerOne':
                    answerOne.current = true
                    undoscreen.current = true
                    answerselected.current = answerProp.current.one
                    cor_selected.current = corAnswerOne
                    logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
                    logselected_label.current = { label_x: logLabelPositionOne_x, label_y: logLabelPositionOne_y, label_time: logGazeTime }
                    corAnswerOne = 0;

                    break;

                case 'answerTwo':
                    answerTwo.current = true;
                    undoscreen.current = true
                    answerselected.current = answerProp.current.two
                    cor_selected.current = corAnswerTwo
                    logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
                    logselected_label.current = { label_x: logLabelPositionTwo_x, label_y: logLabelPositionTwo_y, label_time: logGazeTime }
                    corAnswerTwo = 0;
                    break;

                case 'answerThree':
                    answerThree.current = true;
                    undoscreen.current = true
                    answerselected.current = answerProp.current.three
                    cor_selected.current = corAnswerThree
                    logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
                    logselected_label.current = { label_x: logLabelPositionTwo_x, label_y: logLabelPositionTwo_y, label_time: logGazeTime }
                    corAnswerThree = 0;
                    break;

            }
            // setTimeout(function () {
            setUndo('1')
            // }, 1000);
        }
    }

    // Conditional Question State control
    const questionNumber = () => {
        if (question.current === 0) {
            return <SecondScreen header="EyeVote Remote" />
        }
        // else if (question.current > 11) {
        //     return <AccuracyTest id={id.current} />
        // }
        else if (undo === '1') {
            // render the UndoScreen
            return (UndoScreen({ prompt: "Your answer was: " + answerselected.current, change: "Change", next: "Next" }));
        }
        else if (question.current > 0 && question.current <= 10) {
            return (QuestionScreen(questionArray[question.current]));
        } else if (question.current === 11) {
            calibrationDone.current = false
            return (
                <StudyEnd />
            )
        } else {
            return <StartScreen header="EyeVote Remote" />
        }
    }

    // Function on clicking Start button
    function start() {
        //add start timestamp
        // db.collection("studyfiles").doc(id.current).update( {
        //     start_time: firebase.firestore.Timestamp.now()
        // }
        // )

        // Set API Key
        // window.GazeCloudAPI.APIKey= "GazeBehavior_NonCommercialUse"

        // Start with the Callibration and start Eyetracker
        // window.GazeCloudAPI.StartEyeTracking()

        // Use Gaze 
        // window.GazeCloudAPI.OnResult = PlotGaze
    }

    // Handle Gaze results
    function PlotGaze(result) {

        gaze_x = result.docX;
        gaze_y = result.docY;
        gaze_time = result.time;

        Correlation(gaze_x, gaze_y, gaze_time)
    }



    const nextQuestion = () => {
        question.current = question.current + 1
        socket.emit('question-change', question.current)
    }

    // useEffect(() => {
    //     // clear for tracking intervall
    //     const interval = setInterval(() => {
    //         // Check if calibration is done
    //         if (calibrationDone.current === true) {

    //             // In case of undo
    //             if ((undoscreen.current === true) && (answerOne.current === true || answerTwo.current === true || answerThree.current === true)) {
    //                 if (((corAnswerOne) >= 1.4) && (corAnswerOne > corAnswerTwo) && (corAnswerOne > corAnswerThree)) {
    //                     //console.log("CHANGE: " + corAnswerOne)
    //                     answerOne.current = false
    //                     answerTwo.current = false
    //                     answerThree.current = false
    //                     empty()
    //                     undoscreen.current = false
    //                     corAnswerOne = 0
    //                     setTimeout(function () {
    //                         //console.log("Timeout over")
    //                         setUndo('0')
    //                     }, 1000);

    //                 }

    //                 // If corelation for answer one is over corReference
    //                 if (((corAnswerThree) >= 1.4) && (corAnswerThree > corAnswerOne) && (corAnswerThree > corAnswerTwo)) {
    //                     //console.log("NEXT: " + corAnswerThree)
    //                     logData();
    //                     answerOne.current = false
    //                     answerTwo.current = false
    //                     answerThree.current = false
    //                     undoscreen.current = false
    //                     nextQuestion()
    //                     corAnswerThree = 0
    //                     empty()
    //                     setTimeout(function () {
    //                         //console.log("Timeout over")
    //                         setUndo('0')
    //                     }, 1000);
    //                 }
    //             }

    //             // check correllation
    //             else if ((undoscreen.current === false) && (answerOne.current === false) && (answerTwo.current === false) && (answerThree.current === false)) {
    //                 // If correlation for answer one is over corReference

    //                 if (((corAnswerOne) >= 1.4) && (corAnswerOne > corAnswerTwo) && (corAnswerOne > corAnswerThree)) {
    //                     //console.log("Answer One: " + corAnswerOne)
    //                     answerOne.current = true
    //                     undoscreen.current = true
    //                     answerselected.current = answerProp.current.one
    //                     cor_selected.current = corAnswerOne
    //                     logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
    //                     logselected_label.current = { label_x: logLabelPositionOne_x, label_y: logLabelPositionOne_y, label_time: logGazeTime }
    //                     corAnswerOne = 0;
    //                     setTimeout(function () {
    //                         //console.log("Timeout over")
    //                         setUndo('1')
    //                     }, 1000);
    //                 }

    //                 // If correlation for answer two is over corReference
    //                 else if (((corAnswerTwo) >= 1.4) && (corAnswerTwo > corAnswerOne) && (corAnswerTwo > corAnswerThree)) {
    //                     //console.log("Answer Two: " + corAnswerTwo)
    //                     answerTwo.current = true;
    //                     undoscreen.current = true
    //                     answerselected.current = answerProp.current.two
    //                     cor_selected.current = corAnswerTwo
    //                     logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
    //                     logselected_label.current = { label_x: logLabelPositionTwo_x, label_y: logLabelPositionTwo_y, label_time: logGazeTime }
    //                     corAnswerTwo = 0;
    //                     setTimeout(function () {
    //                         //console.log("Timeout over")
    //                         setUndo('1')
    //                     }, 1000);
    //                 }

    //                 // If correlation for answer three is over corReference
    //                 else if (((corAnswerThree) >= 1.4) && (corAnswerThree > corAnswerOne) && (corAnswerThree > corAnswerTwo)) {
    //                     //console.log("Answer Three: " + corAnswerThree)
    //                     answerThree.current = true;
    //                     undoscreen.current = true
    //                     answerselected.current = answerProp.current.three
    //                     cor_selected.current = corAnswerThree
    //                     logselected_gaze.current = { gaze_x: logGazePosition_x, gaze_y: logGazePosition_y, gaze_time: logGazeTime }
    //                     logselected_label.current = { label_x: logLabelPositionTwo_x, label_y: logLabelPositionTwo_y, label_time: logGazeTime }
    //                     corAnswerThree = 0;
    //                     setTimeout(function () {
    //                         //console.log("Timeout over")
    //                         setUndo('1')
    //                     }, 1000);
    //                 }
    //             }
    //         }
    //         else {
    //         }

    //         empty();
    //     }, 2000);
    // })

    // log data into firestore
    function logData() {
        // if (question.current < 10) {
        //     db.collection("studyfiles").doc(id.current).set({
        //         question_data: {
        //             [`question_${question.current}`]: { answerselected: answerselected.current, gaze: logselected_gaze.current, label: logselected_label.current, correlation: cor_selected.current }
        //         }
        //     }, { merge: true })
        // }
        // if (question.current === 10) {
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
                <label className='answerOne' id="answerOne"> </label>
                <label className='answerTwo' id="answerTwo"> </label>
                <label className='answerThree' id="answerThree"> </label>
                <div className="descriptionBox">
                    <h1 className='titleEyeVote'>{props.header}</h1>
                    <h4 className='instructions marginTop'>The study will start with a calibration.</h4>
                    <h4 className='instructions'>Please use mobile to scan the QR code below.</h4>

                    <div className="boxCenter">

                        <Image
                            //   loader={myLoader}
                            src="/qrcode.jpg"
                            alt="QR code to mobile eye tracker"
                            width={500}
                            height={500}
                        />
                        <h4 className='instructions'>Please click "NEXT" button on mobile if ready.</h4>
                    </div>
                    <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => {
                            // start(); 
                            nextQuestion()
                            setUndo('2')
                        }}>
                            Start Calibration
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
                    <h4 className='instructions marginTop'>You will be asked 10 questions now.</h4><h4 className='instructions'>Select an answer by following its movement with your gaze.</h4>
                    <div className="boxCenter">
                        <button className='eyevotebutton marginTop' onClick={() => { nextQuestion(); setUndo('3'); calibrationDone.current = true; }}>
                            Start
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Question screen
    const QuestionScreen = (props) => {
        // console.log(props)
        answerProp.current = { one: props.one, two: props.two, three: props.three }
        return (
            <div className='Eyevote'>
                {/* <h1 className='question' id="questionPrompt">Follow the red number</h1> */}
                <h1 className='question' id="questionPrompt">{props.prompt}</h1>
                <label className='answerOne' id="answerOne">{props.one}</label>
                <label className='answerTwo' id="answerTwo">{props.two}</label>
                <label className='answerThree' id="answerThree">{props.three}</label>
                {/*                 
                <label className='answerOne' id="answerOne">x</label>
                <label className='answerOne-fix'>{props.one}</label>
                <label className='answerTwo' id="answerTwo">x</label>
                <label className='answerTwo-fix'>{props.two}</label>

                <label className='answerThree' id="answerThree">x</label>
                <label className='answerThree-fix'>{props.three}</label> */}

            </div>
        );
    }

    // Undo Screen
    const UndoScreen = (props) => {
        return (
            <div className='Eyevote'>
                <h1 className='question' id="questionPrompt">{props.prompt}
                    {/* {` Do you want to change your answer?`} */}
                </h1>
                {/* <button onClick={
                    () =>
                        nextQuestion()
                }> NEXT </button> */}
                {/* <label className='answerTwo-fix'>Show next question in 10 seconds..</label> */}
                {/* <button className='eyevotebutton marginTop' onClick={() => {
                            // start(); 
                            nextQuestion()
                            setUndo('2')
                        }}>
                            Next Question
                        </button> */}
                <label className='answerOne' id="answerOne">{props.change}</label>
                <label className='answerTwo' id="answerTwo"></label>
                <label className='answerThree' id="answerThree">{props.next}</label>
            </div >
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
                        <button className='eyevotebutton marginTop' onClick={() => { nextQuestion(); setUndo('3'); }}>
                            Okay
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* <StartScreen header="EyeVote Remote" /> */}
            {questionNumber()}
        </div>
    )
}

export default EyeVote