import React, { Component } from 'react';
import Spinner from 'react-spinkit';  
import Button from './Button.js';
import Track from './Track.js';
import Playlist from './Playlist.js'
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
      // Get accessToken and check if spotify premium
      var USER_REQ_URL = "https://api.spotify.com/v1/me?access_token=" + accessToken
      axios.get(CORS_ANYWHERE + USER_REQ_URL)
        .then(response => {
            this.state = {
              loggedIn: true,
              accessToken: accessToken,
              account: response.data.product,
              displayTrackInfo: true,
              saved: false,
              playing: false,
              minutesLeft: 59,
              displayPlaylists: false
            }

            this.minuteInterval = setInterval(() => {
              this.setState({
                ...this.state,
                minutesLeft : this.state.minutesLeft - 1
              })

              if (this.state.minutesLeft <= 0) {
                clearInterval(this.minuteInterval);
                this.logOut()
              }
            }, 60000)
          }
        ).catch(function (err) {
            console.log(err);
          }
        ).then(() => {
          // Get New Relases
          if (this.state.account === "premium") {
            var DISC_REQ_URL = "https://api.spotify.com/v1/browse/new-releases?country=US&limit=50&access_token=" + accessToken
            axios.get(CORS_ANYWHERE + DISC_REQ_URL)
              .then(response => {
                  this.setState({
                    ...this.state,
                    newMusic: response.data.albums.items,
                  })
                })
              .catch(function (err) {
                  console.log(err)
                }
              )
            }
          }
        ).catch(function (err) {
            console.log(err);
          }
        ).then(() => {
          if (this.state.account === "premium") {
            var FEAT_PLAYLIST_URL = "https://api.spotify.com/v1/browse/featured-playlists?country=US&limit=10&access_token=" + accessToken
            axios.get(CORS_ANYWHERE + FEAT_PLAYLIST_URL)
              .then(async response => {
                await this.setState({
                  ...this.state,
                  featuredPlaylists: response.data.playlists.items
                })


                var featPlaylistNameToIndex = {}
                for (var index in this.state.featuredPlaylists) {
                  var name = this.state.featuredPlaylists[index].name
                  featPlaylistNameToIndex[name] = index 
                }

                await this.setState({
                  ...this.state,
                  featPlaylistNameToIndex: featPlaylistNameToIndex,
                  currPlaylistIndex: "NR",
                  currPlaylistName: "New Releases"
                })
              })
              .catch(function (err) {
                console.log(err)
              })
          }

        }).catch(function (err) {
            console.log(err);
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
      const currAlbumImage = currTrack.album.images[1].url
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
    }).catch(function (err) {
        console.log(err);
      }
    )
  }

  // Toggle play/pause
  onPlayClick() {
    var playPromise = this.player.togglePlay();

    if (playPromise !== undefined) {
      playPromise.then(this.player.togglePlay())
    } else {
      console.log('pause error')
    }
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

  async playTrack() {
    if (this.state && this.state.deviceId && this.state.currPlaylistIndex) {
      if (this.state.currPlaylistIndex === "NR") {
        this.playDiscoverTrack()
      } else {
        this.playFeauturedTrack()
      }
    }
  }

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
        }).then(() => {
          this.setState({
            ...this.state,
            saved: false})
        })
        .catch(function (err) {
            console.log(err);
          }
        )
    }
  }

  // Query the current playlist and play a random song from it
  async playFeauturedTrack() {
    if (this.state && this.state.deviceId && this.state.currPlaylistIndex) {
      var playlistId = this.state.featuredPlaylists[this.state.currPlaylistIndex].id
      var PL_TRACKS_URL = "https://api.spotify.com/v1/playlists/" + playlistId + "/tracks/?access_token=" + this.state.accessToken
      axios.get(CORS_ANYWHERE + PL_TRACKS_URL)
        .then(async response => {
          var totalTracks = response.data.total
          var offset = Math.floor(Math.random() * totalTracks)
          var trackURI = response.data.items[offset].track.uri
          fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
              authorization: `Bearer ${this.state.accessToken}`,
            },
            device_id: this.state.deviceId,
            body: JSON.stringify({
              "uris": [trackURI]
            }),
          }).then(() => {
            this.setState({
              ...this.state,
              saved: false})
          }).catch(function (err) {
            console.log(err);
            }
          )

        })
        .catch(function (err) {
          console.log(err);
        })
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
      }).catch(function (err) {
            console.log(err);
          }
        )
    }
  }


  async setCurrentFeaturedPlaylistTracks(playlistId, offset) {
    var TRACK_REQ_URL = "https://api.spotify.com/v1/playlists/" + playlistId + "/tracks/?access_token=" + this.state.accessToken + "&offset=" + offset
    await axios.get(CORS_ANYWHERE + TRACK_REQ_URL)
      .then(response => {
        console.log(response)
      })
  }

  setCurrPlaylist(playlistIndex) {
    if (playlistIndex === "NR") {
      this.setState({
        ...this.state,
        currPlaylistIndex: playlistIndex,
        currPlaylistName: "New Releases"
      })
    } else {
      this.setState({
        ...this.state,
        currPlaylistIndex: playlistIndex,
        currPlaylistName: this.state.featuredPlaylists[playlistIndex].name
      })
    }
  }

  getTrackFromFeaturedPlaylists(currPlaylist) {
    console.log("not implemented")
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

  displayPlaylists() {
    this.setState({
      ...this.state,
      displayPlaylists: !this.state.displayPlaylists
    })
  }

  logOut() {
    // Stop the music
    if (this.state && this.state.playing) {
      this.onPlayClick()
    }

    // Cancel countdown interval

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

  // <Button name="print" action={this.logState}/> 

  /** END PAGE STATE **/

	render() {
		return (
      <div allow="encrypted-media, autoplay">
      <div className="noSupport"> Please use desktop for a better experience! </div>
			<div className="container">
        <div className="row row1">
          <div className="small-box" style = {{color: "grey"}}>
            <div> Minimal Listening </div>
            <div> Discover New Music Without Bias </div>
          </div>
          <div className="large-box">
            {/* User has not yet logged in so there is no accessToken */}
            {this.state && !this.state.loggedIn && (<Button name="Login with Spotify Premium"/>)}

            {/* Logout Button */}
            {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && (
              <div>
                <Button name="Logout" action = {() => this.logOut()}/>
              </div>
            )}
          </div>
        </div>

        <div className="row row2">
          <div className="small-box">
            {/** Page is Loading because its either waiting for state to load or waiting for player to load **/}
            {(!this.state || (this.state.loggedIn && this.state.account === "premium" && (!this.state.deviceId || !this.state.currPlaylistName))) &&
              (<div> Loading... </div>)
            }

            {/** Page has loaded but user is not premium **/}
            {this.state && this.state.loggedIn && this.state.account !== "premium" && 
              <div> Spotify only allows external streaming for premium users. Apologies for the inconvience.</div>
            }

            {/* Play New Track */}
            {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && (
              <div>
                <Button name="Play New Track" action={() => this.playTrack()}/>
                <div style={{color: "grey"}}> from {this.state.currPlaylistName} </div>
              </div>
            )}
          </div>
          <div className="large-box">
          {/* Selcting which playlist to play music from */}
          {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && this.state.featuredPlaylists && (
            <Button name={this.state.displayPlaylists ? "Hide Spotify Featured Playlists" : "Select From Spotify Featured Playlists"} action={() => this.displayPlaylists()}/>
          )}
          {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && this.state.featuredPlaylists && this.state.displayPlaylists && (
            <div>
              <Playlist active={this.state.currPlaylistIndex === "NR"} name="New Releases" index="NR" action={() => this.setCurrPlaylist("NR")}/>
              {this.state.featuredPlaylists[0] && (
                <Playlist active={this.state.currPlaylistIndex === 0} name={this.state.featuredPlaylists[0].name} index={0} action={() => this.setCurrPlaylist(0)}/>
              )}
              {this.state.featuredPlaylists[1] && (
                <Playlist active={this.state.currPlaylistIndex === 1} name={this.state.featuredPlaylists[1].name} index={1} action={() => this.setCurrPlaylist(1)}/>
              )}
              {this.state.featuredPlaylists[2] && (
                <Playlist active={this.state.currPlaylistIndex === 2} name={this.state.featuredPlaylists[2].name} index={2} action={() => this.setCurrPlaylist(2)}/>
              )}
              {this.state.featuredPlaylists[3] && (
                <Playlist active={this.state.currPlaylistIndex === 3} name={this.state.featuredPlaylists[3].name} index={3} action={() => this.setCurrPlaylist(3)}/>
              )}
              {this.state.featuredPlaylists[4] && (
                <Playlist active={this.state.currPlaylistIndex === 4} name={this.state.featuredPlaylists[4].name} index={4} action={() => this.setCurrPlaylist(4)}/>
              )}
              {this.state.featuredPlaylists[5] && (
                <Playlist active={this.state.currPlaylistIndex === 5} name={this.state.featuredPlaylists[5].name} index={5} action={() => this.setCurrPlaylist(5)}/>
              )}
              {this.state.featuredPlaylists[6] && (
                <Playlist active={this.state.currPlaylistIndex === 6} name={this.state.featuredPlaylists[6].name} index={6} action={() => this.setCurrPlaylist(6)}/>
              )}
              {this.state.featuredPlaylists[7] && (
                <Playlist active={this.state.currPlaylistIndex === 7} name={this.state.featuredPlaylists[7].name} index={7} action={() => this.setCurrPlaylist(7)}/>
              )}
              {this.state.featuredPlaylists[8] && (
                <Playlist active={this.state.currPlaylistIndex === 8} name={this.state.featuredPlaylists[8].name} index={8} action={() => this.setCurrPlaylist(8)}/>
              )}
              {this.state.featuredPlaylists[9] && (
                <Playlist active={this.state.currPlaylistIndex === 9} name={this.state.featuredPlaylists[9].name} index={9} action={() => this.setCurrPlaylist(9)}/>
              )}
            </div>
          )}
          </div>
        </div>

        <div className="row row3">
          <div className="small-box">
            {/* Player Status Functions */}
            {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && (
              <div>
                <div><Button name={this.state.playing ? "Pause" : "Play"} action={() => this.onPlayClick()}/></div>
                <div><Button name={this.state.saved ? "Saved!" : "Save Current Track"} action={() => this.saveCurrentTrack()}/></div>
                <div><Button name={this.state.displayTrackInfo ? "Hide Track Info" : "Display Track Info"} action={() => this.displayTrackInfo()}/></div>
              </div>
            )}
          </div>
          <div className="large-box">
          </div>
        </div>
        <div className="row row4">
          <div className="small-box">
            {/* Track Info  */}
            {this.state && this.state.loggedIn && this.state.deviceId && this.state.account === "premium" && (
              <div>
          
                {this.state.displayTrackInfo && (
                  <div>
                    <Track track={this.state.currTrack}/>
                  </div>)
                }
              </div>
            )}
          </div>
          <div className="large-box"> 
            <div className="spinner">
              {this.state && this.state.playing && <Spinner name="line-scale" color="grey"/>}
            </div>
          </div>
        </div>

        <div className="row row5">
          <div className="small-box">
          </div>
          <div className="large-box">
          </div>
        </div>
			</div>
      </div>
		)
	}
}