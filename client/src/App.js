import 'bootstrap/dist/css/bootstrap.min.css'
import Login from './components/Login'
import Home from './components/Home'
import Room from './components/Room'

import './App.css'

const code = new URLSearchParams(window.location.search).get('code')

function App() {
  // return code ? (roomId != "" ? <Player code={code}/>:<Home code={code}/>) : <Login/>
  return code ? <Room code={code}/> : <Login/>
}

export default App;
