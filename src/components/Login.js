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
    this.getTrack = this.getTrack.bind(this)
    this.logState = this.logState.bind(this)
    this.getCurrentTrack = this.getCurrentTrack.bind(this)
  }



  /** START PLAYER FUNCTIONS **/

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
    this.player.on('player_state_changed', currState => this.onStateChanged(currState));

    // Ready
    this.player.on('ready', async data => {
      let { device_id } = data;
      console.log("Let the music play on!");
      await this.setState({ 
        ...this.state,
        deviceId: device_id
      });
      this.transferPlaybackHere();
    });
  }

  onStateChanged(currState) {
    // if we're no longer listening to music, we'll get a null state.
    if (currState !== null) {
      const currTrack = currState.track_window.current_track;
      const currTrackName = currTrack.name;
      const currAlbumName = currTrack.album.name;
      const currArtistName = currTrack.artists
        .map(artist => artist.name)
        .join(", ");
      const playing = !currState.paused;
      this.setState({
        ...this.state,
        currTrack,
        currTrackName,
        currAlbumName,
        currArtistName,
        playing
      });
    }
  }

  transferPlaybackHere() {
    const { deviceId, accessToken } = this.state;
    fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "device_ids": [ deviceId ],
        "play": false,
      }),
    })
  }

  onPlayClick() {
    this.player.togglePlay();
  }
  /** END PLAYER FUNCTIONS **/


  /** START TRACK PARSING **/

  getTrack() {
    if (this.state.loggedIn) {
      console.log("hello")
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
            discoverTrack: response.data.items[0],
          })
        }
      ).catch(function (err) {
          console.log(err);
        }
      )
  }

  async setAlbumSettings(album) {
    console.log("hello")
    await this.setState({
      ...this.state,
      discoverAlbumName: album.name,
      discoverAlbumReleaseDate: album.release_date,
      discoverAlbumId: album.id
    })
  }

  /** END TRACK PARSING **/

  /** START TRACK INFO **/ 

  getCurrentTrack() {
    if (this.state && this.state.deviceId) {
      const CURR_TRACK_URL = "https://api.spotify.com/v1/me/player/currently-playing/?access_token=" + this.state.accessToken
      console.log(CURR_TRACK_URL)
      axios.get(CORS_ANYWHERE + CURR_TRACK_URL)
        .then(response => {
          console.log(response.data)
        })
        .catch(function (err) {
            console.log(err);
          }
        )

    }
  }

  getTrackDetails(sid) {
    if (this.state.deviceId !== null) {
      console.log("hello")
    }

  }

  playDiscoverTrack() {
    if (this.state && this.state.deviceId) {
      this.getTrack()
      setTimeout(() => {
        var trackURI = this.state.discoverTrack.uri
        fetch("https://api.spotify.com/v1/me/player/play", {
          method: "PUT",
          headers: {
            authorization: `Bearer ${this.state.accessToken}`,
          },
          device_id: this.state.deviceId,
          body: JSON.stringify({
            "uris": [trackURI]
          }),
        })
      }, 500)
    }
  }

  saveCurrentTrack() {
    if (this.state && this.state.deviceId) {
      var currTrackId = this.state.currTrack.id
      fetch("https://api.spotify.com/v1/me/tracks", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${this.state.accessToken}`,
          "Content-Type": "application/json",
        },
        ids: [currTrackId],
        body: JSON.stringify({
            "ids": [currTrackId]
          }),
      })
    }
  }

  /** END TRACK INFO **/

  logState() {
    console.log('logging state...')
    if (this.state) {
      console.log(this.state)
    }
  }

	render() {
		return (
			<div className="login">
				<Button name="login"/>
        <Button name="print" action={this.logState}/>
        <Button name="discover" action={this.discoverNewArtists}/>
        <Button name="getTrack" action={this.getTrack}/>
        {this.state && this.state.deviceId !== null && (
          <div>
            <div>Artist: {this.state.currArtistName}</div>
            <div>Track: {this.state.currTrackName}</div>
            <div>Album: {this.state.currAlbumName}</div>
            <Button name={this.state.playing ? "Pause" : "Play"} action={() => this.onPlayClick()}/>
            <Button name="getInfo" action={this.getCurrentTrack}/>
            <Button name="playDiscoverTrack" action={() => this.playDiscoverTrack()}/>
            <Button name="saveCurrentTrack" action={() => this.saveCurrentTrack()}/>
          </div>)
        }
			</div>

		)
	}

}