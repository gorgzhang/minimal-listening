import React, { Component } from 'react';
import Home from './components/Home.js'
import RedirectPage from './components/RedirectPage.js'
import {BrowserRouter as Router, Route} from "react-router-dom";
import './css/App.css';

class App extends Component {

  render() {
    return (
      <Router>
        <div className='App'>
          <Route exact path="/" component={Home} />
          <Route exact path="/redirect" component={RedirectPage} />
        </div>
      </Router>
    );
  }
}

export default App;
