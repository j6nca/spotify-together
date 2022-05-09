import { useState } from 'react'
import useAuth from "../hooks/useAuth"

import { Container, Form } from 'react-bootstrap'

export default function Home({ code }) {
    const accessToken = useAuth(code)
    const [roomId, setRoomId] = useState("")
    const [name, setName] = useState("")
    
    return <Container className="d-flex flex-column py-2" style={{ height: "100vh"}}>
        <button id = 'create'>Create Room</button>
        <Form.Control type="search" id="joinId" placeholder="Already have a room? Enter the join code here" value ={roomId} onChange={e => setRoomId(e.target.value)}/>

        <Form.Control type="search" id="clientAlias" placeholder="What's your name?" value ={name} onChange={e => setName(e.target.value)}/>

        <button id = 'join'>Join Room</button>
       
        <div className="flex-grow-1 my-2" style={{ overflowY:"auto"}}>
            Songs
        </div>
        
    </Container>
}
