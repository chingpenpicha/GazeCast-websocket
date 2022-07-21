import { useState } from "react";
import { useRouter } from 'next/router'

const Home = () => {
    const router = useRouter()
    const [pid, setPid] = useState('')
    const [idErr, setIdErr] = useState('')

    const handleNextPage = () => {
        // rounter
        if (pid) {
            router.push(`/eyevote/${pid}`)
        } else {
            setIdErr('Please input P id !')
        }
    }

    return (
        <div className="App">

            <p></p>
            <h1 className="title">Eye-Tracking Study: GazeCast </h1>

            <div className="body">
                <p className='question_title'>Participant Id: <span style={{ color: 'red' }}>{idErr}</span></p>
                <input type="text" pid="pid" value={pid} onChange={(e) => setPid(e.target.value)} />
            </div>
            <p className="body">First of all, thank you for your interest in my Master Thesis study “Remote Eye-Tracking Studies: challenges and opportunities of conducting eye-tracking studies out of the lab”.</p>

            <p className="body">The aim of this study is to collect eyegaze data from the user to compare the gaze accuracy with a traditional lab study.</p>
            <p className="body">This study will take approximately 15 minutes.
            </p>
            <p className="body">Once the study starts, you will be asked 10 questions and will gaze at the moving answers that you want to select. The questions will only include neutral and personal questions where there is
                no right or wrong. E.g. “Which ice cream flavor would you choose? Vanilla, Chocolate or Strawberry.” You will be able to undo your answer selection if you want to repeat the question.</p>

            <div className="body">Preperation:
                <ol className='body' style={{ listStyleType: "decimal" }}>
                    <li>You need a desktop or a laptop with a webcam. A webcam is needed to track your eyegaze.</li>
                    <li>Sit in a quiet and bright room.</li>
                    <li>Please don't have a direct light pointing at the webcam or near your head. This will irritate the eye tracking.</li>
                    <li>Please set your browser size to fullscreen-mode now. (A very common shortcut is the F11 key or on Mac: Control + Command + F) This helps you to not get distracted by other tabs. </li>
                </ol>
            </div>
            <p className="body">After clicking "Continue", you will be led to the Consent Form first.</p>
            <button onClick={handleNextPage} className="start-button">Continue</button>
        </div>
    );
}

export default Home