import React, {Component} from 'react';

const CLIENT_ID = "9eca37cf81d94340ba6627853b621ae7"
const REDIRECT_URI = "http://localhost:3000/"
// const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com/"
const LOGIN_URL = "https://accounts.spotify.com/authorize?client_id=" + CLIENT_ID + "&response_type=token&redirect_uri=" + REDIRECT_URI + "&show_dialog=true"

export default class Button extends Component {

	constructor(props) {
		super(props)
		console.log("constructed with", props.name)
	}

	handleClick(name, action) {
		console.log(name)
		if (name === "login") {
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