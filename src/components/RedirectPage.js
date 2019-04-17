import React, {Component} from 'react';
import {Redirect} from 'react-router';

export default class RedirectPage extends Component {

	constructor(props) {
		super(props)
		var hash = document.location["hash"]
    console.log(document.location)
		var token = null;
		if (hash) {
			token = hash.split("=")[1].split("&")[0]
		}
    this.state = {token: token}

	}

	render() {
		return (
      <div>
        {this.state && this.state.token && (<Redirect to={{pathname: "/", state: {token: this.state.token}}}/>)}
        {(!this.state || !this.state.token) && <div> redirecting... </div>}
      </div>
		)
	}

}