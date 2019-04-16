import React, { Component } from 'react';
// import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import Button from './components/Button.js';
import Login from './components/Login.js'
import './css/App.css';

// const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com/"

class App extends Component {
  constructor(props) {
    super(props);

    var hash = document.location["hash"]
    // var at = "BQD61Xav7f0OlEEgxw0f_QIC3ej4R0TZoUFOH6yy55nF2c3P11p0WyI9ke-Rlvlj0kcm9m3LKBOB0d4T2uZlBtiecky8vWTnzSSMLVVyVFjbMYRXjv2BHVjKM4IAuQgtIkHe8F-ju-0KCWRUteLhSIywcbM6RFA67VM"
    // var hash = "#access_token=" + at + "&token_type=Bearer&expires_in=3600"
    if (hash) {
      var token = hash.split("=")[1].split("&")[0]
      console.log(token)
      this.state = {
        loggedIn: true,
        accessToken: token
      }
    } else {
      this.state = {
        loggedIn: false,
        accessToken: null
      }
    }
    this.logState = this.logState.bind(this)
    this.discoverNewArtists = this.discoverNewArtists.bind(this)
  }

  logState() {
    console.log('logging state...')
    if (this.state) {
      console.log(this.state['loggedIn'])
      console.log(this.state['accessToken'])
    }
  }

  discoverNewArtists() {
    console.log("discovering")
    var REQ_URL = "https://api.spotify.com/v1/browse/new-releases?country=US&limit=5&access_token=" + this.state["accessToken"]
    fetch(REQ_URL)
    .then(response =>
      console.log(response)
      )
  }

  render() {
    return (
      <div className="App">
        <Login/>
        <Button name="parse" action={this.parseURL}/>
        <Button name="print" action={this.logState}/>
        <Button name="discover" action={this.discoverNewArtists}/>
        {/*
        <Router>
          <Link to="/">Login</Link>
          <Link to="/discover/">Discover</Link>
          <Route path="/" exact render={() => <Login/>}/>
          <Route path="/discover/" exact render={() => <Button name="discover" action={this.logState}/>}/>
        </Router>
        */}
      </div>
     
    );
  }
}

export default App;
