import { useState } from "react";
import Image from 'next/image'
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
                <b >Participant Id: </b>
                <input type="text" pid="pid" value={pid} onChange={(e) => setPid(e.target.value)} />
                <p style={{ color: 'red' }}>{idErr}</p>
            </div>
            <p className="body">First of all, thank you for your interest in my Master Thesis study “GazeCast: Using a mobile device to eye-track gaze interaction on the public display”.</p>
            <p className="body">The purpose of this experiment is to evaluate the effectiveness of an eye-tracker provided by a smartphone camera to that of a standard web camera. This study will take approximately 30 minutes. </p>

            <div className="flex body">
                <span>
                    <p>There will be three primary sections to this study: one with a camera, one with a phone on a stand, and
                        one with a phone in your hand.  The task you must complete is to follow the pink potato on the screen with your eyes, using a different sort of eye-tracker for each
                        section.</p>
                    <p>Before starting each task, you will have a training task to learn how to interact with the
                        display. Then it will be followed by six more tasks. You will be asked to complete
                        the questionnaire after completing each section.</p>
                    <p>
                        I'll record your time spent on the study as well as any screen-based gaze data. All participant
                        data will be stored securely and in an anonymous form.
                    </p>

                </span>
                <Image
                    src="/interface_eg.png"
                    alt="QR code to mobile eye tracker"
                    width={600}
                    height={305}
                />
            </div>


            <div className="body">
                NOTE*
                <ol className='body' style={{ listStyleType: "decimal" }}>
                    <li>If you have any questions, please ask.</li>
                    <li>Try to follow the pink object every moment until it detects movement.</li>
                    <li>Make sure to move your eyes, not your head. Try to keep your head centred all the time.</li>
                    <li>Stay relaxed and remember that the eye-tracker, not you, is being evaluated.</li>
                </ol>
            </div>
            <button onClick={handleNextPage} className="start-button">Continue</button>
        </div>
    );
}

export default Home