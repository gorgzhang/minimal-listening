import React, {Component} from 'react';


export default class Track extends Component {

	constructor(props) {
		super(props)
		this.state = {
			track: props.track
		}
	}

  // Monitor updates to state
	componentDidUpdate(oldProps) {
	  if(oldProps.track !== this.props.track) {
	    this.setState({track: this.props.track})
	  }
	}

	render() {
		return (
      <div>
  			{this.state.track && 
          (<div>
  					<div>Artist: {this.state.track.artists.map(artist => artist.name).join(", ")} </div>
            <div>Track: {this.state.track.name} </div>
            <div>Album: {this.state.track.album.name} </div>
            <img src={this.state.track.album.images[0].url} alt="album cover"/>
  				</div>)
		    }
      </div>
		)
	}

}