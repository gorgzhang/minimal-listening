import React, {Component} from 'react';


export default class Playlist extends Component {

	constructor(props) {
		super(props)
		this.state = {
			name: props.name,
			active: props.active,
		}
	}

  componentDidUpdate(oldProps) {
    if(oldProps.active !== this.props.active) {
      this.setState({active: this.props.active})
    }
  }

	render() {
		return (
      <div>
  			{this.state.name && this.state.active &&
          	(<div className="Playlist" onClick={() => this.props.action()}>{this.state.name}</div>)
		    }
        {this.state.name && !this.state.active &&
            (<div style={{color: "grey"}} className="Playlist" onClick={() => this.props.action()}>{this.state.name}</div>)
        }
      </div>
		)
	}

}