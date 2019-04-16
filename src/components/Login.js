import React, { Component } from 'react';
// import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import Button from './Button.js';
import './../css/App.css';
import axios from 'axios'

const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com/"

export default class Login extends Component {

  constructor(props) {
    super(props)

    this.playerCheckInterval = null;
    var hash = document.location["hash"]
    // var at = "BQDp8lcACW2zfTWnGh-ecgDx041AuwDk2STSRwRzglhc0GaaNVk_a6GOdl72P3oS-30_9Tl3CXEZjzwjHeQddr_POAHaHzojP8MJ9RA7WbtkxjMHJZ-l4FlhXt1HxdjSb6lOOyPdNw9p3UK_miMqKe-Mx2WfOxRaH_Y"
    // var hash = "#access_token=" + at + "&token_type=Bearer&expires_in=3600"

    if (hash) {
      // Logged in
      var token = hash.split("=")[1].split("&")[0]
      console.log(token)
      // Get 50 recent album releases
      var DISC_REQ_URL = "https://api.spotify.com/v1/browse/new-releases?country=US&limit=50&access_token=" + token
      axios.get(CORS_ANYWHERE + DISC_REQ_URL)
      .then(response => {
          console.log(response.data.albums)
          this.state = {
            loggedIn: true,
            accessToken: token,
            newMusic: response.data.albums.items,
            currTrack: null,
          }
        }
      ).catch(function (err) {
          console.log(err);
        }
      )

      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
    } else {
      // Not logged in yet
      this.state = {
        loggedIn: false,
        accessToken: null,
        newMusic: null,
        currTrack: null,
      }
    }
    this.getSong = this.getSong.bind(this)
    this.logState = this.logState.bind(this)
  }

  checkForPlayer() {
    var accessToken = this.state.accessToken;

    if (window.Spotify !== null) {
      this.player = new window.Spotify.Player({
        name: "Minimal Player",
        getOAuthToken: cb => { cb(accessToken); },
      });
      clearInterval(this.playerCheckInterval);
      this.createEventHandlers();
      this.player.connect();
    }
  }

  createEventHandlers() {
    this.player.on('initialization_error', e => { console.error(e); });
    this.player.on('authentication_error', e => {
      console.error(e);
      this.setState({ loggedIn: false });
    });
    this.player.on('account_error', e => { console.error(e); });
    this.player.on('playback_error', e => { console.error(e); });

    // Playback status updates
    this.player.on('player_state_changed', state => { console.log(state); });

    // Ready
    this.player.on('ready', data => {
      let { device_id } = data;
      console.log("Let the music play on!");
      this.setState({ 
        ...this.state,
        deviceId: device_id
      });
    });
  }

  logState() {
    console.log('logging state...')
    if (this.state) {
      console.log(this.state)
    }
  }

  getSong() {
    if (this.state.loggedIn) {
      var index = Math.floor(Math.random() * 50)
      var currAlbum = this.state.newMusic[index]
      this.parseAlbum(currAlbum)
    }

  }

  parseAlbum(album) {
    console.log(album)
    var albumLength = album.total_tracks
    var offSet =  Math.floor(Math.random() * albumLength)
    this.getTrackFromAlbum(album.id, offSet)
    this.setAlbumSettings(album)
  }

  getTrackFromAlbum(albumId, offset) {
    var TRACK_REQ_URL = "https://api.spotify.com/v1/albums/" + albumId + "/tracks/?access_token=" + this.state.accessToken + "&offset=" + offset
    axios.get(CORS_ANYWHERE + TRACK_REQ_URL)
      .then(response => {
          console.log(response.data.items[0])
          this.setState({
            ...this.state,
            currTrack: response.data.items[0],
          })
        }
      ).catch(function (err) {
          console.log(err);
        }
      )
  }

  setAlbumSettings(album) {
    console.log("hello")
    this.setState({
      ...this.state,
      albumName: album.name,
      albumReleaseDate: album.release_date,
      albumId: album.id
    })
  }

	render() {
		return (
			<div className="login">
				<Button name="login"/>
        <Button name="print" action={this.logState}/>
        <Button name="discover" action={this.discoverNewArtists}/>
        <Button name="getSong" action={this.getSong}/>
			</div>
		)
	}

}