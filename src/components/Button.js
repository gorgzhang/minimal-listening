import React, {Component} from 'react';

const CLIENT_ID = "9eca37cf81d94340ba6627853b621ae7"
const REDIRECT_URI = "http://localhost:3000/redirect"
// const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com/"

export default class Button extends Component {

	handleClick(name, action) {
		// Redirect for login
		if (name === "login") {
			var scopes = "streaming user-read-birthdate user-read-email user-read-private user-read-currently-playing user-read-playback-state user-library-modify"
			var LOGIN_URL = "https://accounts.spotify.com/authorize?client_id=" + CLIENT_ID + 
				 "&response_type=token&redirect_uri=" + REDIRECT_URI +
				 "&show_dialog=true" +
				 (scopes ? '&scope=' + encodeURIComponent(scopes) : '')
			window.location.replace(LOGIN_URL)
		}

		if (action) {
			action()
		}
	}

	render() {
		return (<div onClick={() => this.handleClick(this.props.name, this.props.action)}>{this.props.name}</div>)
	}

}