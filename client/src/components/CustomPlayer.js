import React, {useState} from 'react'

export default function CustomPlayer({handlePlay, handlePause, isPlaying}) {
    const [play, setPlay] = useState(false)
    function doPlay(){
        handlePlay()
    }
    function doPause(){
        handlePause()
    }
    return (
        <div>
            <span className="input-group-btn">
                <button 
                    id="play" 
                    className="btn btn-primary"
                    onClick={isPlaying?doPause:doPlay}
                >
                {isPlaying? "Pause" : "Play"}
                </button>
            </span>
        </div>
    )
}
