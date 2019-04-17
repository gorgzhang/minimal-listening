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
          (<div style={{color:"grey"}}>
            <img src={this.state.track.album.images[1].url} alt="album cover"/>
            <div style={{marginTop: "10px"}}> {this.state.track.name} </div>
  					<div>by {this.state.track.artists.map(artist => artist.name).join(", ")} </div>
            <div>on {this.state.track.album.name} </div>     
  				</div>)
		    }
      </div>
		)
	}

}