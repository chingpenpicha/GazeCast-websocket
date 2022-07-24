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
            <p className="body">First of all, thank you for your interest in my Master Thesis study “GazeCast: Using mobile for eye tracking on public display by Pursuit”.</p>
            <p className="body">The purpose of this experiment is to evaluate the effectiveness of an eye-tracker provided by a smartphone camera to that of a standard web camera. </p>
            <p className="body">This study will take approximately 30 minutes.</p>
            <p className="body">Once the study starts, there will be three primary sections to this study. The task you must complete is to follow the white circle on the screen with your eyes using a different sort of eye-tracker for each section.
                To be clear, run three tests: one with a camera, one with a phone on a stand, and one with a phone in your hand. I'll record your time spent on the study as well as any screen-based gaze data.</p>

            <div className="body">
                <ol className='body' style={{ listStyleType: "decimal" }}>
                    <li>If you have any questions, please ask.</li>
                    <li>After completing each test, Each section will include a questionnaire that you must complete.</li>
                    <li>Stay relaxed and remember that the eye-tracker, not you, is being evaluated.</li>
                    <li>You can brink your eyes or request a break after each section if you like.</li>
                </ol>
            </div>
            <p className="body">After clicking "Continue", you will be led to the Consent Form first.</p>
            <button onClick={handleNextPage} className="start-button">Continue</button>
        </div>
    );
}

export default Home