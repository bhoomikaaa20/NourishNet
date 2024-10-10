import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import "./Home.css";
import backgroundVideo from "./images/background-video.mp4";
import giveFoodIcon from "./images/giveFoodIcon.png";
import getFoodIcon from "./images/getFoodIcon.png";
import giveMoneyIcon from "./images/giveMoneyIcon.png";
import volunteerIcon from "./images/volunteerIcon.png";

const Home = () => {
  return (
    <>
      <div className="home">
        <video autoPlay loop muted className="home-video">
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="home-content">
          <h1 className="home-title">
            NourishNet: Connecting Surplus Food from One to Many
          </h1>
          <br />
          <p className="home-subtitle">
            Join us in our mission to reduce food waste and help those in need.
          </p>
          <button className="home-button">Get Started</button>
        </div>
      </div>
      <div className="cards-container">
        <Link to="/donate-food" className="card">
          {" "}
          {/* Add Link here */}
          <img src={giveFoodIcon} alt="Give Food" className="card-icon" />
          <h2 className="card-heading">Give Food</h2>
          <p className="card-text">
            Help us by donating surplus food to those in need.
          </p>
        </Link>
        <Link to="/request-food" className="card">
          {" "}
          {/* Add Link here */}
          <img src={getFoodIcon} alt="Get Food" className="card-icon" />
          <h2 className="card-heading">Get Food</h2>
          <p className="card-text">
            If you need food, find out how we can help you.
          </p>
        </Link>
        <Link to="/donate-money" className="card">
          {" "}
          {/* Add Link here */}
          <img src={giveMoneyIcon} alt="Give Money" className="card-icon" />
          <h2 className="card-heading">Give Money</h2>
          <p className="card-text">
            Support our cause by making a financial donation.
          </p>
        </Link>
        <Link to="/contact" className="card">
          {" "}
          {/* Add Link here */}
          <img src={volunteerIcon} alt="Volunteer" className="card-icon" />
          <h2 className="card-heading">Volunteer</h2>
          <p className="card-text">
            Join our team of volunteers and make a difference.
          </p>
        </Link>
      </div>
    </>
  );
};

export default Home;
