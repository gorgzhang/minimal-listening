import React, { Component } from 'react';
import Button from './Button.js';
import Track from './Track.js';
import './../css/App.css';
import './../css/Home.css';
import axios from 'axios'


const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com/"

export default class Home extends Component {

  constructor(props) {
    super(props)
    var accessToken = null;
    if (this.props.location.state) {
      accessToken = this.props.location.state.token
    }
    this.playerCheckInterval = null;
    if (accessToken) {
      // Logged in - Get 50 recent album releases
      var USER_REQ_URL = "https://api.spotify.com/v1/me?access_token=" + accessToken
      console.log(USER_REQ_URL)
      axios.get(CORS_ANYWHERE + USER_REQ_URL)
        .then(response => {
            this.state = {
              loggedIn: true,
              accessToken: accessToken,
              account: response.data.product,
              displayTrackInfo: false,
              saved: false,
            }
          }
        ).catch(function (err) {
            console.log(err);
          }
        ).then(() => {
          if (this.state.account === "premium") {
            var DISC_REQ_URL = "https://api.spotify.com/v1/browse/new-releases?country=US&limit=50&access_token=" + accessToken
            axios.get(CORS_ANYWHERE + DISC_REQ_URL)
              .then(response => {
                  this.setState({
                    ...this.state,
                    loggedIn: true,
                    accessToken: accessToken,
                    newMusic: response.data.albums.items,
                    displayTrackInfo: false,
                    saved: false,
                  })
                }
              ).catch(function (err) {
                  console.log(err);
                }
              )
            }
          }
        )

      
      

      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
    } else {
      // Not logged in yet
      this.state = {
        loggedIn: false,
        displayTrackInfo: false,
        saved: false,
      }
    }
    this.getDiscoverTrack = this.getDiscoverTrack.bind(this)
    this.logState = this.logState.bind(this)
    this.getCurrentTrack = this.getCurrentTrack.bind(this)
  }

  /** START PLAYER FUNCTIONS **/

  // Wait for player to load
  checkForPlayer() {
    if (this.state && this.state.loggedIn && window.Spotify) {
      var accessToken = this.state.accessToken;
      this.player = new window.Spotify.Player({
        name: "Minimal Listening",
        getOAuthToken: cb => {cb(accessToken)},
      });
      clearInterval(this.playerCheckInterval);
      this.createEventHandlers();
      this.player.connect();
    }
  }

  // Listeners for the player
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
      const currAlbumImage = currTrack.album.images[0].url
      const currArtistName = currTrack.artists
        .map(artist => artist.name)
        .join(", ");
      const playing = !currState.paused;
      this.setState({
        ...this.state,
        currTrack,
        currTrackName,
        currAlbumName,
        currAlbumImage,
        currArtistName,
        playing
      });
    }
  }

  // Automatically play in web instead of desktop app
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

  // Toggle play/pause
  onPlayClick() {
    this.player.togglePlay();
  }
  /** END PLAYER FUNCTIONS **/


  /** START TRACK PARSING **/

  // Discover New Track from releases
  async getDiscoverTrack() {
    if (this.state.loggedIn) {
      var index = Math.floor(Math.random() * 50)
      var currAlbum = this.state.newMusic[index]
      var currAlbumLength = currAlbum.total_tracks
      var offSet =  Math.floor(Math.random() * currAlbumLength)
      await this.setDiscoverTrackFromAlbum(currAlbum.id, offSet)
    }
  }

  // Set discover track state
  async setDiscoverTrackFromAlbum(albumId, offset) {
    var TRACK_REQ_URL = "https://api.spotify.com/v1/albums/" + albumId + "/tracks/?access_token=" + this.state.accessToken + "&offset=" + offset
    await axios.get(CORS_ANYWHERE + TRACK_REQ_URL)
      .then(response => {
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

  /** END TRACK PARSING **/

  /** START TRACK INFO **/ 

  // Get info about what's currently playing
  getCurrentTrack() {
    if (this.state && this.state.deviceId) {
      const CURR_TRACK_URL = "https://api.spotify.com/v1/me/player/currently-playing/?access_token=" + this.state.accessToken
      axios.get(CORS_ANYWHERE + CURR_TRACK_URL)
        .then(response => {
          console.log("I dont use this yet...")
          console.log(response.data)
        })
        .catch(function (err) {
            console.log(err);
          }
        )
    }
  }

  // Query a discover track and play it
  async playDiscoverTrack() {
    if (this.state && this.state.deviceId) {
        await this.getDiscoverTrack()
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
        }).then(() => {this.setState({...this.state, saved: false})})
    }
  }

  // Save what is currently playing
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
      }).then(() => {
        this.setState({
          ...this.state,
          saved: true
        })
      })
    }
  }

  /** END TRACK INFO **/

  /** START PAGE STATE **/

  // Whether to hide track info or not
  displayTrackInfo() {
    this.setState({
      ...this.state,
      displayTrackInfo: !this.state.displayTrackInfo
    })
  }

  logOut() {
    this.setState({
      loggedIn: false,
      displayTrackInfo: false,
      saved: false,
    })
  }

  logState() {
    if (this.state) {
      console.log(this.state)
    }
  }

  /** END PAGE STATE **/

	render() {
		return (
			<div>
      <Button name="print" action={this.logState}/>
        {/** Page is Loading because its either waiting for state to load or waiting for player to load **/}
        {(!this.state || (this.state.loggedIn && this.state.account === "premium" && !(this.state.deviceId))) &&
          (<div> loading... </div>)
        }

        {/** Page has loaded but user is not premium **/}
        {this.state && (this.state.account !== "premium") && 
          <div> Spotify only allows external streaming for premium users. Apologies for the inconvience.</div>
        }

        {/** User has not yet logged in so there is no accessToken **/}
        {this.state && !this.state.loggedIn && (<Button name="login"/>)}

        {/** User has logged in, is premium, and player has loaded  **/}
        {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && (
          <div>
            <Button name="Logout" action = {() => this.logOut()}/>
            <Button name={this.state.playing ? "Pause" : "Play"} action={() => this.onPlayClick()}/>
            <Button name="Discover New Track" action={() => this.playDiscoverTrack()}/>
            <Button name={this.state.saved ? "Saved!" : "Save Current Track"} action={() => this.saveCurrentTrack()}/>
            <Button name={this.state.displayTrackInfo ? "Hide Track Info" : "Display Track Info"} action={() => this.displayTrackInfo()}/>
            {this.state.displayTrackInfo && (
              <div>
                <Track track={this.state.currTrack}/>
              </div>)
            }
          </div>)
        }
			</div>

		)
	}
}