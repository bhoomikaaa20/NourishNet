import React from 'react';
import 'Cards.css';
import giveFoodIcon from '../images/giveFoodIcon.png'; 
import getFoodIcon from '../images/getFoodIcon.png';
import giveMoneyIcon from '../images/giveMoneyIcon.png'; 
import volunteerIcon from '../images/volunteerIcon.png'; 

const Cards = () => {
  return (
    <div className="cards-container">
      <div className="card">
        <img src={giveFoodIcon} alt="Give Food" className="card-icon" />
        <h2 className="card-heading">Give Food</h2>
        <p className="card-text">Help us by donating surplus food to those in need.</p>
      </div>
      <div className="card">
        <img src={getFoodIcon} alt="Get Food" className="card-icon" />
        <h2 className="card-heading">Get Food</h2>
        <p className="card-text">If you need food, find out how we can help you.</p>
      </div>
      <div className="card">
        <img src={giveMoneyIcon} alt="Give Money" className="card-icon" />
        <h2 className="card-heading">Give Money</h2>
        <p className="card-text">Support our cause by making a financial donation.</p>
      </div>
      <div className="card">
        <img src={volunteerIcon} alt="Volunteer" className="card-icon" />
        <h2 className="card-heading">Volunteer</h2>
        <p className="card-text">Join our team of volunteers and make a difference.</p>

      </div>
    </div>
  );
};

export default Cards;