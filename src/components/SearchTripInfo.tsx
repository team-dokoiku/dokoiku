import React from "react";
import { connect } from "react-redux";
import {
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions
} from "@material-ui/core";
import moment from "moment";

import { myFirestore } from "../config/firebase";

// Material UI and styling
import "../styles/Modal.css";
import { Grid, Typography } from "@material-ui/core";
import DoubleArrowIcon from "@material-ui/icons/DoubleArrow";
import DateRangeIcon from "@material-ui/icons/DateRange";
import LocationOnIcon from "@material-ui/icons/LocationOn";

import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HelpIcon from "@material-ui/icons/Help";
import PaymentIcon from "@material-ui/icons/Payment";
import "../styles/TripInfo.css";
import countriesToCurrencies from "../data/countries_to_currencies.json";
import axios from "axios";

import { User, Trip, Waypoint } from "../redux/stateTypes";
import { CountryToCurrency } from "../data/types";

type myProps = {
  searchTrips: Trip[];
  users: User[];
  currentSearchTripIndex: number;
  userId: string;
  displayProfile: string;
  userCurrencyCode: string;
  onShowChat: () => void;
  onPreviousTrip: () => void;
  onNextTrip: () => void;
  onJoinTrip: (ownerId: string, userId: string, tripId: string) => void;
  onChangeDisplayProfile: (profile: string) => void;
};

type myState = {
  toggleDialog: boolean;
  userCurrencyBudget: number;
  pendingStatus: boolean[];
};

class SearchTripInfo extends React.Component<myProps, myState> {
  constructor(props: myProps) {
    super(props);
    this.state = {
      toggleDialog: false,
      userCurrencyBudget: 0,
      pendingStatus: this.props.searchTrips.map(() => false)
    };
  }

  handleToggle = () => {
    this.setState({
      toggleDialog: !this.state.toggleDialog
    });
  };
  exchangeCurrency = async (
    fromCurrency: string,
    toCurrency: string,
    budget: number
  ) => {
    const result = await axios.get(
      `https://currency-exchange.p.rapidapi.com/exchange?q=1&from=${fromCurrency}&to=${toCurrency}`,
      {
        headers: {
          "x-rapidapi-host": process.env.REACT_APP_X_RAPIDAPI_HOST,
          "x-rapidapi-key": process.env.REACT_APP_X_RAPIDAPI_KEY
        }
      }
    );

    const userCurrencyBudget = result.data * budget;
    this.setState({ userCurrencyBudget });
  };
  componentWillMount() {
    this.exchangeCurrency(
      this.props.searchTrips[this.props.currentSearchTripIndex].currencyCode,
      this.props.userCurrencyCode,
      this.props.searchTrips[this.props.currentSearchTripIndex].budget
    );
  }
  render() {
    if (this.props.users.length && this.props.userCurrencyCode) {
      return (
        <div className="TripInfo">
          {/* Title */}
          <div style={{ maxHeight: 480, overflow: "scroll" }}>
            <Typography variant="h4" className="noWrapper">
              <b>
                {this.props.searchTrips[this.props.currentSearchTripIndex].name}
              </b>
            </Typography>

            {/* Country */}
            <Typography className="iconWrapper">
              <strong>Country: </strong>
              <img
                src={`https://www.countryflags.io/${this.props.searchTrips[
                  this.props.currentSearchTripIndex
                ].countryCode.toLowerCase()}/shiny/24.png`}
                alt="flag"
              ></img>
              {
                countriesToCurrencies.find(
                  (item: CountryToCurrency) =>
                    this.props.searchTrips[this.props.currentSearchTripIndex]
                      .countryCode === item.countryCode
                ).country
              }
            </Typography>

            {/* Starting Location */}
            <Typography className="noWrapper">
              <DoubleArrowIcon />
              <strong>Starting Location: </strong>
              {` ${
                this.props.searchTrips[this.props.currentSearchTripIndex]
                  .startLocation
              }`}
            </Typography>

            {/* Start Date */}
            <Typography className="noWrapper">
              <DateRangeIcon />
              <strong>Start Date: </strong>
              {moment(
                this.props.searchTrips[
                  this.props.currentSearchTripIndex
                ].startDate.toDate()
              ).format("MMMM Do YYYY")}
            </Typography>

            {/* End Date */}
            <Typography className="noWrapper">
              <DateRangeIcon />
              <strong>End Date: </strong>
              {moment(
                this.props.searchTrips[
                  this.props.currentSearchTripIndex
                ].endDate.toDate()
              ).format("MMMM Do YYYY")}
            </Typography>

            {/* WayPoints */}
            <div>
              <Typography className="noWrapper">
                <LocationOnIcon />
                <strong className="boldText topPadding">Destinations:</strong>
              </Typography>
              <ul className="ul-test">
                {this.props.searchTrips[
                  this.props.currentSearchTripIndex
                ].waypoints.map((waypoint: Waypoint) => {
                  return (
                    <>
                      <Typography className="noWrapper">
                        <li>{waypoint.location}</li>
                      </Typography>
                    </>
                  );
                })}
              </ul>
            </div>

            {/* Budget */}
            <Typography className="noWrapper topPadding">
              <PaymentIcon />
              <strong>Budget:&nbsp; </strong>
              {
                this.props.searchTrips[this.props.currentSearchTripIndex].budget
              }{" "}
              {
                countriesToCurrencies.find(
                  (item: CountryToCurrency) =>
                    this.props.searchTrips[this.props.currentSearchTripIndex]
                      .currencyCode === item.currencyCode
                ).currency
              }
              <Tooltip
                title={
                  this.props.userCurrencyCode !== "None"
                    ? Math.round(this.state.userCurrencyBudget * 100) / 100 +
                      " " +
                      countriesToCurrencies
                        .concat([
                          {
                            country: "None",
                            countryCode: "None",
                            currency: "None",
                            currencyCode: "None"
                          }
                        ])
                        .find(
                          (item: CountryToCurrency) =>
                            this.props.userCurrencyCode === item.currencyCode
                        ).currency
                    : ""
                }
                placement="top-end"
              >
                <HelpIcon color="primary" fontSize="small" />
              </Tooltip>
            </Typography>

            <div className="spacer10"></div>

            <div>
              <Typography className="noWrapper topPadding">
                <strong>Owned by:</strong>
              </Typography>
              <div>
                {[
                  this.props.searchTrips[this.props.currentSearchTripIndex]
                    .memberIds[0]
                ].map((memberId: string, i: number) => {
                  const nickname = this.props.users.find(
                    (u: { id: string }) => u.id === memberId
                  ).nickname;
                  const photoUrl = this.props.users.find(
                    (u: { id: string }) => u.id === memberId
                  ).photoUrl;
                  return (
                    <div>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="medium"
                        fullWidth
                        key={i}
                        onClick={() => {
                          this.props.onChangeDisplayProfile(memberId);
                        }}
                      >
                        <img
                          src={photoUrl}
                          className="profile-picture"
                          alt={nickname}
                          onClick={() => {
                            const modal = document.getElementById(
                              "change-photo"
                            );
                            modal.style.display = "block";
                          }}
                        />
                        {nickname}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
            <br />
            <div>
              <Typography className="noWrapper topPadding">
                <strong>Members:</strong>
              </Typography>
              <Typography className="noWrapper">
                {this.props.searchTrips[this.props.currentSearchTripIndex]
                  .memberIds.length === 1
                  ? "1 member"
                  : "" +
                    this.props.searchTrips[this.props.currentSearchTripIndex]
                      .memberIds.length +
                    " members"}
              </Typography>
              <br />
            </div>
          </div>
          <Button
            onClick={() => {
              this.props.onJoinTrip(
                this.props.searchTrips[this.props.currentSearchTripIndex]
                  .ownerId,
                this.props.userId,
                this.props.searchTrips[this.props.currentSearchTripIndex].tripId
              );
              const newPendingState = this.state.pendingStatus;
              newPendingState[this.props.currentSearchTripIndex] = true;
              this.setState({
                pendingStatus: newPendingState
              });
              this.handleToggle();
            }}
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            <GroupAddIcon />
            {this.state.pendingStatus[this.props.currentSearchTripIndex]
              ? "Pending"
              : "JOIN!"}
          </Button>
          {this.state.toggleDialog ? (
            <Dialog open={this.state.toggleDialog}>
              <DialogTitle>Request Sent</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Your request to join this trip has been sent!
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={this.handleToggle}>Close</Button>
              </DialogActions>
            </Dialog>
          ) : null}
          {/* Previous & Next Button */}
          {this.props.searchTrips.length > 1 ? (
            <Grid container>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="default"
                  size="small"
                  fullWidth
                  onClick={() => {
                    this.props.onPreviousTrip();
                    this.props.onChangeDisplayProfile(undefined);
                    if (this.props.currentSearchTripIndex - 1 >= 0) {
                      this.exchangeCurrency(
                        this.props.searchTrips[
                          this.props.currentSearchTripIndex - 1
                        ].currencyCode,
                        this.props.userCurrencyCode,
                        this.props.searchTrips[
                          this.props.currentSearchTripIndex - 1
                        ].budget
                      );
                    } else {
                      this.exchangeCurrency(
                        this.props.searchTrips[
                          this.props.searchTrips.length - 1
                        ].currencyCode,
                        this.props.userCurrencyCode,
                        this.props.searchTrips[
                          this.props.searchTrips.length - 1
                        ].budget
                      );
                    }
                  }}
                >
                  <ArrowBackIosIcon />
                  Previous
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="default"
                  size="small"
                  fullWidth
                  onClick={() => {
                    this.props.onNextTrip();
                    this.props.onChangeDisplayProfile(undefined);
                    if (
                      this.props.currentSearchTripIndex + 1 <
                      this.props.searchTrips.length
                    ) {
                      this.exchangeCurrency(
                        this.props.searchTrips[
                          this.props.currentSearchTripIndex + 1
                        ].currencyCode,
                        this.props.userCurrencyCode,
                        this.props.searchTrips[
                          this.props.currentSearchTripIndex + 1
                        ].budget
                      );
                    } else {
                      this.exchangeCurrency(
                        this.props.searchTrips[0].currencyCode,
                        this.props.userCurrencyCode,
                        this.props.searchTrips[0].budget
                      );
                    }
                  }}
                >
                  Next
                  <ArrowForwardIosIcon />
                </Button>
              </Grid>
            </Grid>
          ) : null}
        </div>
      );
    } else {
      return "Loading... Please try again shortly.";
    }
  }
}

const mapStateToProps = (state: any) => {
  return {
    userId: state.userId,
    searchTrips: state.searchTrips,
    users: state.users,
    currentSearchTripIndex: state.currentSearchTripIndex,
    displayProfile: state.displayProfile,
    userCurrencyCode: state.userCurrencyCode
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    onShowChat: () =>
      dispatch({
        type: "SHOW_CHAT"
      }),
    onPreviousTrip: () =>
      dispatch({
        type: "PREVIOUS_SEARCH_TRIP"
      }),
    onNextTrip: () =>
      dispatch({
        type: "NEXT_SEARCH_TRIP"
      }),
    onJoinTrip: (ownerId: string, userId: string, tripId: string) => {
      myFirestore
        .collection("users")
        .doc(ownerId)
        .collection("requests")
        .doc(userId + tripId)
        .set({
          fromId: userId,
          tripId: tripId
        });
      myFirestore
        .collection("users")
        .doc(userId)
        .collection("pendingTrips")
        .doc(tripId)
        .set({ tripId });
    },
    onChangeDisplayProfile: (profile: string) =>
      dispatch({
        type: "CHANGE_DISPLAY_PROFILE",
        displayProfile: profile
      })
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchTripInfo);
