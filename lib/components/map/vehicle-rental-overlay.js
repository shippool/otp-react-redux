import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { FeatureGroup, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'

import SetFromToButtons from './set-from-to'
import { vehicleRentalQuery } from '../../actions/api'
import { setLocation } from '../../actions/map'

class VehicleRentalOverlay extends Component {
  static propTypes = {
    queryMode: PropTypes.string,
    vehicles: PropTypes.array,
    refreshVehicles: PropTypes.func
  }

  _startRefreshing () {
    // ititial station retrieval
    this.props.refreshVehicles()

    // set up timer to refresh stations periodically
    this._refreshTimer = setInterval(() => {
      this.props.refreshVehicles()
    }, 30000) // defaults to every 30 sec. TODO: make this configurable?*/
  }

  _stopRefreshing () {
    if (this._refreshTimer) clearInterval(this._refreshTimer)
  }

  componentDidMount () {
    if (this.props.visible) this._startRefreshing()
  }

  componentWillUnmount () {
    this._stopRefreshing()
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.visible && nextProps.visible) {
      this._startRefreshing()
    } else if (this.props.visible && !nextProps.visible) {
      this._stopRefreshing()
    }
  }

  render () {
    const { stations, companies } = this.props

    let filteredStations = stations
    if (companies) {
      filteredStations = stations.filter(
        station => station.networks.filter(value => companies.includes(value)).length > 0
      )
    }

    if (!filteredStations || filteredStations.length === 0) return <FeatureGroup />

    return (
      <FeatureGroup>
        {filteredStations.map((station) => {
          const stationName = `${station.networks.join('/')} ${station.name || station.id}`

          let className = 'fa fa-map-marker vehicle-rental-icon'
          // If this station is exclusive to a single network, apply the the class for that network
          if (station.networks.length === 1) className += ' vehicle-rental-icon-' + station.networks[0].toLowerCase()
          const markerIcon = divIcon({
            iconSize: [11, 16],
            popupAnchor: [0, -6],
            html: '<i />',
            className
          })

          return (
            <Marker
              icon={markerIcon}
              key={station.id}
              position={[station.y, station.x]}
            >
              <Popup>
                <div className='map-overlay-popup'>
                  {/* Popup title */}
                  <div className='popup-title'>
                    {stationName}
                  </div>

                  {/* Set as from/to toolbar */}
                  <div className='popup-row'>
                    <SetFromToButtons
                      map={this.context.map}
                      location={{
                        lat: station.y,
                        lon: station.x,
                        name: stationName
                      }}
                      setLocation={this.props.setLocation}
                    />
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </FeatureGroup>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    stations: state.otp.overlay.vehicleRental.stations
  }
}

const mapDispatchToProps = {
  refreshVehicles: vehicleRentalQuery,
  setLocation
}

export default connect(mapStateToProps, mapDispatchToProps)(VehicleRentalOverlay)