

import { useEffect } from 'react';
// import EasySeeSo from 'seeso/easy-seeso';

function afterInitialized() {
    console.log('sdk init success!')
}

function afterFailed() {
    console.log('sdk init fail!')
}

const SeeSoInputPage = () => {
    // useEffect(() => {
    //     const initSeeSo = async () => {
    //         const seeso = new EasySeeSo();
    //         // Don't forget to enter your license key.
    //         await seeso.init('dev_j1ibas14bjbydb3xe65mdk9gj42rraplrfxbmu1w', afterInitialized, afterFailed)
    //     }
    //     initSeeSo()
    // }, [])
    return <div>S</div>
}

export default SeeSoInputPage