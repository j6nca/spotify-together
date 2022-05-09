import React from 'react'
import {Container} from 'react-bootstrap'

const AUTH_URL = "https://accounts.spotify.com/authorize?"
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI
const SCOPES = ["streaming", "user-read-email", "user-read-private", "user-library-read", "user-library-modify", "user-read-playback-state", "user-modify-playback-state"]
const RESPONSE_TYPE = "code"
var auth_string = AUTH_URL + "client_id=" + CLIENT_ID + "&response_type=" + RESPONSE_TYPE + "&redirect_uri=" + REDIRECT_URI + "&scope=" + SCOPES.join("%20")


export default function Login() {
  return (
    <Container 
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh"}}>
        <h1>spotify-together</h1>
        <a className="btn btn-success btn-lg" href={auth_string}>Login with Spotify</a>
    </Container>
  )
}
