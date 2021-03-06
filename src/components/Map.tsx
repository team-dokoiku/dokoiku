import React from "react";
import {
  GoogleMap,
  LoadScript,
  DirectionsService,
  DirectionsRenderer,
  Marker
} from "@react-google-maps/api";
import axios from "axios";
import { Card, Typography, CardMedia } from "@material-ui/core";

import "../styles/Map.css";
require("dotenv").config();

type MapProps = {
  trips: any;
  currentTripIndex: number;
};

interface MapState {
  response: any;
  positions: any;
  isResponse: boolean;
  foundRoute: boolean;
}

class Map extends React.Component<MapProps, MapState> {
  constructor(props: MapProps) {
    super(props);
    this.state = {
      response: null,
      positions: [],
      isResponse: true,
      foundRoute: true
    };
    this.directionsCallback = this.directionsCallback.bind(this);
  }

  shouldComponentUpdate(nextProps: MapProps, nextState: MapState) {
    return (
      nextProps.currentTripIndex !== this.props.currentTripIndex ||
      this.state.response === null ||
      !nextState.response.routes[0] ||
      (!this.state.response.routes[0] &&
        nextState.response.routes[0].overview_polyline) ||
      nextState.response.routes[0].overview_polyline !==
        this.state.response.routes[0].overview_polyline ||
      nextState.positions[0] !== this.state.positions[0]
    );
  }

  directionsCallback(response: any | null) {
    if (response !== null) {
      if (response.status === "OK") {
        this.setState(() => ({
          response
        }));
        const responses = response.geocoded_waypoints
          .map((value: any) => value.place_id)
          .map((placeId: string) => {
            return axios.get(
              `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${process.env.REACT_APP_GOOGLE_MAPS_API}`
            );
          });
        Promise.all(responses).then((data: any) => {
          this.setState({
            positions: [
              response.geocoded_waypoints
                .map((value: any) => value.place_id)
                .join(),
              ...data.map(
                (response: any) => response.data.result.geometry.location
              )
            ],
            foundRoute: true
          });
        });
      } else {
        this.setState({ positions: [], response, foundRoute: false });
      }
    }
  }
  componentWillUpdate() {
    if (!this.state.foundRoute) this.setState({ foundRoute: true });
  }
  render() {
    if (this.state.isResponse) {
      return !this.state.foundRoute ? (
        <Card>
          <Typography>
            Sorry! We could not find a route for your trip.
          </Typography>
          <CardMedia
            style={{
              width: "0",
              paddingTop: "1000", // 16:9,
              marginTop: "10"
            }}
            image="https://japanesequizzes.com/wp-content/uploads/2019/08/How-to-say-Sorry-in-Japanese.png"
          />
        </Card>
      ) : (
        <LoadScript
          id="script-loader"
          googleMapsApiKey={`${process.env.REACT_APP_GOOGLE_MAPS_API}`}
        >
          <GoogleMap
            id="map-style"
            mapContainerStyle={{
              height: "100%",
              width: "100%"
            }}
            zoom={0}
            center={{
              lat: 28.891194,
              lng: 171.966131
            }}
          >
            {this.state.positions.length
              ? this.state.positions
                  .slice(1)
                  .map((position: google.maps.LatLng, index: number) => {
                    if (position === this.state.positions[1]) {
                      const icon = {
                        url:
                          "http://maps.google.com/mapfiles/kml/shapes/ranger_station.png",
                        scaledSize: new google.maps.Size(40, 40)
                      };
                      return (
                        <Marker key={index} position={position} icon={icon} />
                      );
                    } else if (
                      position !==
                      this.state.positions[this.state.positions.length - 1]
                    ) {
                      const icon = {
                        url: `https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_red${index}.png`,
                        scaledSize: new google.maps.Size(25, 40)
                      };
                      return (
                        <Marker key={index} position={position} icon={icon} />
                      );
                    }
                    return undefined; //put in this line to solve a linter error; delete if it causes trouble
                  })
              : null}
            <DirectionsService
              options={{
                origin: this.props.trips[this.props.currentTripIndex]
                  .startLocation,
                destination: this.props.trips[this.props.currentTripIndex]
                  .startLocation,
                waypoints: this.props.trips[this.props.currentTripIndex]
                  .waypoints,
                travelMode: this.props.trips[this.props.currentTripIndex]
                  .travelMode
              }}
              callback={this.directionsCallback}
            />
            {this.state.response ? (
              <DirectionsRenderer
                options={{
                  directions: this.state.response,
                  suppressMarkers: true
                }}
              ></DirectionsRenderer>
            ) : null}
          </GoogleMap>
        </LoadScript>
      );
    } else {
      return "There are no directions for your trip";
    }
  }
}

export default Map;
