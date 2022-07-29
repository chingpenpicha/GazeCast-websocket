export const getFaceStatus = (v)=> {
    switch(v){
        case 0:
            return 'BEST POSITION'

        case 1:
            return 'LOW CONFIDENCE'

        case 2:
            return 'UNSUPPORTED'

        case 3:
            return 'FACE MISSING'
        default:
            return 'N/A'
    }
}