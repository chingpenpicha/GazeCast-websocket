

import { useEffect } from 'react';

const licenseKey = process.env.SEESO_KEY
let TrackingState 

const SeeSoInputPage = () => {
    function onGaze(gazeInfo) {
        // do something with gaze info.
        // if (gazeInfo.trackingState === TrackingState?.SUCCESS) {
        console.log('gazeInfo', gazeInfo.x, gazeInfo.y)
        // }
    }

    // debug callback.
    function onDebug(FPS, latency_min, latency_max, latency_avg) {
        // do something with debug info.
    }

    useEffect(() => {
        const initSeeSo = async () => {
            const EasySeeSo = await import('seeso/easy-seeso')
            /**
             * set monitor size.    default: 16 inch.
             * set face distance.   default: 30 cm.
             * set camera position. default:
             * camera x: right center
             * cameraOnTop: true
             */
            const seeSo = new EasySeeSo.default();
            // console.log(seeSo)
            await seeSo.init(licenseKey,()=>{
                seeSo.setMonitorSize(16);
                seeSo.setFaceDistance(50);
                seeSo.setCameraPosition(window.outerWidth / 2, true);
                seeSo.startTracking(onGaze, onDebug)
            },()=>{console.log("callback when init failed"); alert('init See So failed')})
        }
        initSeeSo()
    }, [])

    return <div>S</div>
}

export default SeeSoInputPage