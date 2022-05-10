import { useState, useEffect } from 'react'
import useAuth from "../hooks/useAuth"
// import Player from "./Player"
import CustomPlayer from "./CustomPlayer"
import { Container, Form } from 'react-bootstrap'
import SpotifyWebApi from 'spotify-web-api-node'
import SearchResult from './SearchResult'
import UserItem from './UserItem'
import QueueItem from './QueueItem'

import axios from 'axios'
import io from 'socket.io-client'

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID

const spotifyApi = new SpotifyWebApi({
    clientId: CLIENT_ID,
})

const socket = io(process.env.REACT_APP_SERVER_HOST+":"+process.env.REACT_APP_SOCKET_PORT, {
    transports: ["websocket", "polling"]
})

export default function Room({ code }) {
    const accessToken = useAuth(code)

    // out-room state
    const [inputRoomId, setInputRoomId] = useState("")
    const [roomId, setRoomId] = useState("")
    const [clientId, setClientId] = useState("")
    const [alias, setAlias] = useState("")
    const create = event => {
        event.preventDefault();
        // for some reason alias is unset after this req
        socket.emit("create", alias);
    };

    const join = event => {
        console.log(alias)
        event.preventDefault();
        const payLoad = {
            name: alias,
            roomId: inputRoomId
        }
        socket.emit("join", payLoad);
    };
    // in-room states
    // music state
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [queue, setQueue] = useState([])
    const [nowPlaying, setNowPlaying] = useState()
    const [isPlaying, setIsPlaying] = useState(false)
    const [lyrics, setLyrics] = useState("")

    // social state
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState("")
    const [users, setUsers] = useState([])
    const send = event => {
        event.preventDefault();
        socket.emit("send", message);
        setMessage("");
    };

    // function chooseTrack(track){
    //     setNowPlaying(track)
    //     setSearch("")
    //     setLyrics("")
    // }
    function chooseTrack(track){
        const payLoad = {
            name: alias,
            roomId: roomId,
            track: track
        }
        socket.emit("add", payLoad);
        setSearch("");
    };

    function handlePlay(){
        const payLoad = {
            name: alias,
            roomId: roomId,
        }
        socket.emit("play", payLoad);
    };

    function handlePause(){
        const payLoad = {
            name: alias,
            roomId: roomId,
        }
        socket.emit("pause", payLoad);
    };

    useEffect(() => {
        // Socket Connections
        socket.on("connect", () => {
            console.log("Connected with id: " ,socket.id)
            setClientId(socket.id)
        })
        socket.on("connected", user => {
            setUsers(users => [...users, user]);
        })
        socket.on("disconnected", id => {
            console.log("User: " + id + " disconnected")
        })

        // Out-Room
        socket.on("created", res => {
            const payLoad = {
                name: res.host,
                roomId: res.room.id
            }
            console.log(payLoad)
            setAlias(res.host)
            socket.emit("join", payLoad);
        })
        socket.on("joined", res => {
            setRoomId(res.room.id);
            setQueue(res.room.queue);
        })

        // In-Room
        socket.on("newUser", res => {
            console.log("User " + res.name + " has joined the room.")
        })

        socket.on("users", res => {
            console.log("Users updated: ", res)
            setUsers(res)
        })

        socket.on("updateQueue", res => {
            console.log("Queue updated: ", res)
            setQueue(res)
        })

        socket.on("playing", res => {
            console.log("Player updated: ", res)
            setIsPlaying(true)
            setQueue(res.queue)
            setNowPlaying(res.nowPlaying)
        })

        socket.on("paused", res => {
            console.log("Player updated: ", res)
            setIsPlaying(false)
        })
    }, [])

    // get lyrics
    useEffect(() => {
        if(!nowPlaying) return
        axios.get(process.env.REACT_APP_SERVER_HOST+":"+process.env.REACT_APP_SERVER_PORT+"/lyrics", {
            params:{
                track: nowPlaying.title,
                artist: nowPlaying.artist
            }
        }).then(res => {
            setLyrics(res.data.lyrics)
        })
    }, [nowPlaying])
    useEffect(() => {
        if(!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
        if(!search) return setSearchResults([])
        if(!accessToken) return

        let cancel = false
        spotifyApi.searchTracks(search).then(res => {
            if(cancel) return
            console.log(res.body.tracks.items)
            setSearchResults(res.body.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                    if (image.height < smallest.height) return image
                    return smallest
                }, track.album.images[0])
                return{
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url
                }
            })
            )
        })
        return () => (cancel = true)
    }, [search, accessToken])

    return roomId? (<div>
    {/* <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}> */}
    <div className ="d-flex flex-row">
        <div className ="p-2">
    <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
        <Form.Control 
            type="search" 
            placeholder="Search Songs/Artists" 
            value ={search} 
            onChange={e => setSearch(e.target.value)}
        />
        <div className="flex-grow-1 my-2" style={{ overflowY:"auto"}}>
            {searchResults.map(track => (
                <SearchResult 
                    track={track} 
                    chooseTrack={chooseTrack} 
                    key={track.uri}
                />
            ))}
            {searchResults.length === 0 && (
                <div 
                    className="text-center"
                    style={{ whiteSpace:"pre"}}
                >
                    {lyrics}
                </div>
            )}
        </div>
        <div>
            {/* <Player 
                accessToken={accessToken} 
                trackUri={nowPlaying?.uri}
            /> */}
            {nowPlaying?<QueueItem track={nowPlaying} />:<div></div>}
            <CustomPlayer
                handlePlay={handlePlay}
                handlePause={handlePause}
                isPlaying={isPlaying}
            />
        </div>
        
    </Container>
    </div>
    <div className ="p-2">
    Connected to room: {roomId}
    
    <div className="my-2">
    Connected Users:
        {users.map(user => (
            <UserItem
                user={user} 
                key={user.id}
            />
        ))}
    </div>
    <div>Queue
        {queue.map(track => (
                <QueueItem
                    track={track} 
                    key={track.uri}
                />
            ))}
    </div>
    </div>
    
    </div>
    
    </div>
    ):(<Container>
        <input
            placeholder="Display Name" 
            value ={alias} 
            onChange={e => setAlias(e.target.value)}
        />
        <form
            onSubmit={create}
        >
            <span className="input-group-btn">
                <button id="create" type="submit" className="btn btn-primary">
                    Create Room
                </button>
            </span>
        </form>
        <form
            onSubmit={join}
        >
            <input
                placeholder="Enter a Room Code" 
                value ={inputRoomId} 
                onChange={e => setInputRoomId(e.target.value)}
            />
            
            <span className="input-group-btn">
                <button id="join" type="submit" className="btn btn-primary">
                    Join
                </button>
            </span>
        </form>
    </Container>)
}
