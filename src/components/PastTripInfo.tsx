import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { firestore } from "firebase";
import { myFirestore } from "../config/firebase";
import BasicTripInfo from "./BasicTripInfo";
import Map from "./Map";
import Notes from "./Notes";
import ChatBoard from "./ChatBoard";
import axios from "axios";

// Material UI
import {
  Grid,
  Typography,
  Modal,
  Fade,
  Backdrop,
  Button,
  TextareaAutosize,
  Box,
  Container,
  Card,
  Divider
} from "@material-ui/core";
import Rating from "@material-ui/lab/Rating";
import MessageIcon from "@material-ui/icons/Message";
import RateReviewIcon from "@material-ui/icons/RateReview";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import DescriptionIcon from "@material-ui/icons/Description";
import MapIcon from "@material-ui/icons/Map";
import "../styles/TripInfo.css";
import "../styles/PastTripInfo.css";
import Reviews from "./Reviews";
import { Trip, User } from "../redux/stateTypes";

type MapStateToProps = {
  pastTrips: Trip[];
  currentOngoingTripIndex: number;
  userId: string;
  userName: string;
  users: User[];
  mapTripMessage: number;
  userCurrencyCode: string;
};

type MapDispatchToProps = {
  onPreviousTrip: () => void;
  onNextTrip: () => void;
  toggleNotes: () => void;
  toggleMessages: () => void;
};

enum PageStatus {
  Map,
  Reviews,
  Notes,
  Messages
}

interface States {
  modalStatus: boolean[];
  targetUser: number;
  rating: number;
  message: string;
  isError: boolean;
  pageStatus: PageStatus;
  pastTrips: Trip[];
  currentPastTripIndex: number;
  userCurrencyBudget: number;
}

type Props = MapStateToProps & MapDispatchToProps;

class PastTripInfo extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      modalStatus: [],
      targetUser: -1,
      rating: 0,
      message: "",
      isError: false,
      pageStatus: PageStatus.Map,
      pastTrips: [],
      currentPastTripIndex: 0,
      userCurrencyBudget: 0
    };
  }

  componentDidMount() {
    this.setState({
      pastTrips: this.props.pastTrips
    });

    // Setup modal window status (Open/ Close)
    let initialStatus = Array(this.state.pastTrips.length);
    initialStatus.fill(false);
    this.setState({
      modalStatus: initialStatus
    });
  }

  prevPastTrip = () => {
    let prevIndex: number;

    if (this.state.currentPastTripIndex === 0) {
      prevIndex = this.state.pastTrips.length - 1;
    } else {
      prevIndex = this.state.currentPastTripIndex - 1;
    }
    this.setState({
      currentPastTripIndex: prevIndex
    });
  };

  nextPastTrip = () => {
    let nextIndex: number;
    if (this.state.currentPastTripIndex + 1 >= this.state.pastTrips.length) {
      nextIndex = 0;
    } else {
      nextIndex = this.state.currentPastTripIndex + 1;
    }
    this.setState({
      currentPastTripIndex: nextIndex
    });
  };

  onClickUser = (index: number, member: string) => {
    this.setState({
      targetUser: index
    });

    // get a previous review if possible
    this.checkPrevReview(member);
  };

  checkPrevReview = async (reviewee: string) => {
    const tripId = this.state.pastTrips[
      this.state.currentPastTripIndex
    ].tripId.trim();
    const reviewer = this.props.userId;
    const reviewId = tripId + "_" + reviewer + "_" + reviewee;

    const result = await myFirestore
      .collection("users")
      .doc(reviewee)
      .collection("reviews")
      .doc(reviewId)
      .get();

    if (result.exists) {
      this.setState({
        rating: result.data().rating,
        message: result.data().message
      });
    }
  };

  handleOpen = (index: number) => {
    if (this.state.targetUser === index) return true;
    return false;
  };

  SetMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      message: e.target.value
    });
  };

  handleClose = () => {
    // Reset rating & message
    this.setState({
      targetUser: -1,
      rating: 0,
      message: "",
      isError: false
    });
  };

  saveReviews = (
    event: React.FormEvent<HTMLButtonElement>,
    reviewee: string
  ) => {
    const tripId = this.state.pastTrips[
      this.state.currentPastTripIndex
    ].tripId.trim();
    const reviewer = this.props.userId;
    const reviewId = tripId + "_" + reviewer + "_" + reviewee;
    const postDate = firestore.Timestamp.fromDate(new Date());

    myFirestore
      .collection("users")
      .doc(reviewee)
      .collection("reviews")
      .doc(reviewId)
      .set({
        tripId: myFirestore.doc("trips/" + tripId),
        reviewer: myFirestore.doc("users/" + reviewer),
        rating: this.state.rating,
        message: this.state.message,
        date: postDate
      });
  };

  checkInput = () => {
    if (this.state.rating === 0 || this.state.message === "") return false;
    return true;
  };

  onSubmit = (event: React.FormEvent<HTMLButtonElement>, reviewee: string) => {
    // If textarea or rating is empty, error
    if (!this.checkInput()) {
      this.setState({
        isError: true
      });
      return;
    }

    this.saveReviews(event, reviewee);
    this.handleClose();
  };

  onMapButton = () => {
    this.setState({
      pageStatus: PageStatus.Map
    });
  };

  onReviewButton = () => {
    this.setState({
      pageStatus: PageStatus.Reviews
    });
  };

  onNotesButton = () => {
    this.setState({
      pageStatus: PageStatus.Notes
    });
  };

  onMessagesButton = () => {
    this.setState({
      pageStatus: PageStatus.Messages
    });
  };

  clearButtonStatus = () => {
    this.setState({
      pageStatus: PageStatus.Map
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

  render() {
    return (
      <div>
        {this.state.pastTrips.length === 0 ||
        this.props.userCurrencyCode === "" ? (
          <p>No past trips</p>
        ) : (
          <Grid container>
            {/* Trip details */}
            <Grid item xs={12} sm={4} md={4} lg={4} xl={3}>
              <Container>
                <Card className="pastTripInfo">
                  <div style={{ maxHeight: 520, overflow: "scroll" }}>
                    <div className="tripBasicInfo">
                      <BasicTripInfo
                        country={
                          this.state.pastTrips[this.state.currentPastTripIndex]
                            .countryCode
                        }
                        tripTitle={
                          this.state.pastTrips[this.state.currentPastTripIndex]
                            .name
                        }
                        startDate={moment(
                          this.state.pastTrips[
                            this.state.currentPastTripIndex
                          ].startDate.toDate()
                        ).format("MMMM Do YYYY")}
                        endDate={moment(
                          this.state.pastTrips[
                            this.state.currentPastTripIndex
                          ].endDate.toDate()
                        ).format("MMMM Do YYYY")}
                        location={
                          this.state.pastTrips[this.state.currentPastTripIndex]
                            .startLocation
                        }
                        wayPoints={
                          this.state.pastTrips[this.state.currentPastTripIndex]
                        }
                      />
                    </div>

                    <div className="spacer10"></div>

                    {/* Notes & Messages */}
                    <Grid item>
                      {this.state.pageStatus !== PageStatus.Map ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="medium"
                          fullWidth
                          onClick={this.onMapButton}
                        >
                          <DescriptionIcon className="iconSpacer" />
                          Map
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          fullWidth
                        >
                          <MapIcon className="iconSpacer" />
                          Map
                        </Button>
                      )}
                    </Grid>

                    <Grid item>
                      {this.state.pageStatus !== PageStatus.Reviews ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="medium"
                          fullWidth
                          onClick={this.onReviewButton}
                        >
                          <RateReviewIcon className="iconSpacer" />
                          Reviews for me
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          fullWidth
                        >
                          <RateReviewIcon className="iconSpacer" />
                          Reviews for me
                        </Button>
                      )}
                    </Grid>

                    <Grid item>
                      {this.state.pageStatus !== PageStatus.Notes ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="medium"
                          fullWidth
                          onClick={this.onNotesButton}
                        >
                          <DescriptionIcon className="iconSpacer" />
                          Notes
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          fullWidth
                        >
                          <DescriptionIcon className="iconSpacer" />
                          Notes
                        </Button>
                      )}
                    </Grid>

                    <Grid item>
                      {this.state.pageStatus !== PageStatus.Messages ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="medium"
                          fullWidth
                          onClick={this.onMessagesButton}
                        >
                          <MessageIcon className="iconSpacer" />
                          Messages
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          fullWidth
                        >
                          <MessageIcon className="iconSpacer" />
                          Messages
                        </Button>
                      )}
                    </Grid>

                    <div className="spacer10"></div>

                    {/* Members */}
                    <div>
                      <Typography className="noWrapper topPadding">
                        <strong>Review for Members:</strong>
                      </Typography>
                      <div className="memberContainer">
                        {this.state.pastTrips[
                          this.state.currentPastTripIndex
                        ].memberIds.map((memberId: string, i: number) => {
                          const user = this.props.users.find(
                            (u: { id: string }) => u.id === memberId
                          );
                          const nickname = user.nickname;
                          const photoUrl = user.photoUrl;
                          // skips own data here
                          if (memberId === this.props.userId) return null;

                          return (
                            <div key={i}>
                              {/* <ListItem
                              button
                              onClick={() => this.onClickUser(i, member)}
                            >
                              <ListItemIcon>
                                <PersonIcon className="iconSpacer" />
                              </ListItemIcon>
                              <ListItemText>{nickname}</ListItemText>
                            </ListItem> */}
                              <Button
                                variant="outlined"
                                color="primary"
                                size="medium"
                                fullWidth
                                key={i}
                                onClick={() => this.onClickUser(i, memberId)}
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
                              <Modal
                                className="modalWindow"
                                open={this.handleOpen(i)}
                                onClose={this.handleClose}
                                closeAfterTransition
                                BackdropComponent={Backdrop}
                                BackdropProps={{
                                  timeout: 500
                                }}
                              >
                                <Fade in={this.handleOpen(i)}>
                                  <div className="modalFade">
                                    <Box
                                      component="fieldset"
                                      mb={0}
                                      borderColor="transparent"
                                    >
                                      <h2 id="transition-modal-title">
                                        Review for {nickname}
                                      </h2>
                                    </Box>

                                    {/* Error */}
                                    {this.state.isError && (
                                      <Box
                                        component="fieldset"
                                        mb={0}
                                        borderColor="transparent"
                                      >
                                        <Typography className="error-text">
                                          Textarea or Rating is empty...
                                        </Typography>
                                      </Box>
                                    )}

                                    <Box
                                      component="fieldset"
                                      mb={1}
                                      borderColor="transparent"
                                    >
                                      <Typography component="legend">
                                        Rating
                                      </Typography>
                                      <Rating
                                        name="simple-controlled"
                                        value={this.state.rating}
                                        onChange={(event, newValue) => {
                                          this.setState({
                                            rating: newValue
                                          });
                                        }}
                                      />
                                    </Box>
                                    <Box
                                      component="fieldset"
                                      mb={0}
                                      borderColor="transparent"
                                    >
                                      <Typography component="legend">
                                        Review Message
                                      </Typography>

                                      <TextareaAutosize
                                        className="textarea"
                                        placeholder="Write your review"
                                        rows={10}
                                        onChange={e => this.SetMessage(e)}
                                        value={this.state.message}
                                      />
                                    </Box>
                                    <Box
                                      component="fieldset"
                                      mb={0}
                                      borderColor="transparent"
                                    >
                                      <Button
                                        variant="contained"
                                        color="default"
                                        onClick={this.handleClose}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={event => {
                                          this.onSubmit(event, memberId);
                                        }}
                                      >
                                        Submit
                                      </Button>
                                    </Box>
                                  </div>
                                </Fade>
                              </Modal>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Previous & Next Button */}
                  {this.state.pastTrips.length > 1 ? (
                    <Grid container>
                      <Grid item xs={6}>
                        <Button
                          variant="contained"
                          color="default"
                          size="small"
                          fullWidth
                          onClick={() => {
                            this.clearButtonStatus();
                            this.prevPastTrip();
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
                            this.clearButtonStatus();
                            this.nextPastTrip();
                          }}
                        >
                          Next
                          <ArrowForwardIosIcon />
                        </Button>
                      </Grid>
                    </Grid>
                  ) : null}
                </Card>
              </Container>
            </Grid>
            {/* Map, Review Result */}
            <Grid item xs={12} sm={8} md={8} lg={8} xl={9}>
              {this.state.pageStatus === PageStatus.Map && (
                <Map
                  trips={this.state.pastTrips}
                  currentTripIndex={this.state.currentPastTripIndex}
                />
              )}
              {this.state.pageStatus === PageStatus.Reviews && (
                <div className="review-container">
                  <Typography variant="h5">
                    Reviews for {this.props.userName}
                  </Typography>
                  <Divider />
                  <Reviews
                    tripId={
                      this.state.pastTrips[this.state.currentPastTripIndex]
                        .tripId
                    }
                    userId={this.props.userId}
                  />
                </div>
              )}
              {this.state.pageStatus === PageStatus.Notes && (
                <Notes
                  tripId={
                    this.state.pastTrips[this.state.currentPastTripIndex].tripId
                  }
                />
              )}

              {this.state.pageStatus === PageStatus.Messages && (
                <ChatBoard
                  tripId={
                    this.state.pastTrips[this.state.currentPastTripIndex].tripId
                  }
                />
              )}
            </Grid>
          </Grid>
        )}
      </div>
    );
  }
}
const mapStateToProps = (state: any) => {
  return {
    pastTrips: state.pastTrips,
    currentOngoingTripIndex: state.currentOngoingTripIndex,
    userId: state.userId,
    userName: state.userName,
    users: state.users,
    mapTripMessage: state.mapTripMessage,
    userCurrencyCode: state.userCurrencyCode
  };
};
const mapDispatchToProps = (dispatch: any) => {
  return {
    onPreviousTrip: () => {
      dispatch({
        type: "RESET_TOGGLE_MESSAGES"
      });
      dispatch({
        type: "PREVIOUS_ONGOING_TRIP"
      });
    },
    onNextTrip: () => {
      dispatch({
        type: "RESET_TOGGLE_MESSAGES"
      });
      dispatch({
        type: "NEXT_ONGOING_TRIP"
      });
    },
    toggleNotes: () =>
      dispatch({
        type: "TOGGLE_NOTES"
      }),
    toggleMessages: () =>
      dispatch({
        type: "TOGGLE_MESSAGES"
      })
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PastTripInfo);
