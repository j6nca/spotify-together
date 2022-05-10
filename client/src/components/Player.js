import React, { useEffect, useState } from 'react'
import SpotifyPlayer from 'react-spotify-web-playback'

export default function Player({accessToken, trackUri}) {
    const [play, setPlay] = useState(false)
    useEffect(() => setPlay(true), [trackUri])
    if(!accessToken) return null
    function handlePlay(track){

    }
  return (
  <div>
    <SpotifyPlayer
      token={accessToken}
      showSaveIcon
      callback={state => {
          if(!state.isPlaying) setPlay(false)
      }}
      play={play}
      uris={trackUri ? [trackUri] : []}
      initialVolume={0.5}
      styles={{
        sliderColor:'#1cb954',
        sliderHandleColor:'#fff',
        bgColor:'#121212',
        color:'#b3b3b3',
        trackArtistColor:'#b3b3b3',
        activeColor:'#1DB954'
      }}
    />
  </div>
  )
}
