import React, { Component } from 'react';
// import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import Login from './components/Login.js'
import './css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Login/>
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
