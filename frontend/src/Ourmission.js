import React from 'react';
import './Ourmission.css'; 
import collectionimage from  './images/foodcollecting.jpg';
import rest from './images/food.png';
import shelter from './images/shelter.webp';
import store from './images/storing.webp';
import foodbank from './images/foodbank.webp';

const Ourmission = () => {
    return (
        <>
            <div className="mission-container">
                <div className="mission-content">
                    <div className="mission-heading">
                        <h1>Food Rescue</h1>
                        <div className="mission-underline"></div>
                        <p>Rescue food. Fuel people. Help the environment.</p>
                    </div>
                </div>
                <div 
                    className="mission-bgimage" 
                    style={{
                        background: `url('https://img.freepik.com/free-photo/close-up-people-with-food-donations_23-2149182015.jpg?size=626&ext=jpg&ga=GA1.1.1856053268.1721539854&semt=ais_user') no-repeat center center`, 
                        backgroundSize: 'cover',
                        height: '540px'
                    }}>
                </div>
            </div>
            <div className="main-content">
                <div className="text-content">
                    <h1>Putting food on plates, not in landfill</h1>
                    <h2>What is Food Rescue?</h2>
                    <p>
                        Food rescue is the practice of collecting excess edible food that would otherwise go to waste from places such as farms, grocery stores, restaurants, and dining facilities 
                        and redistributing it to those in our community who need it most.
                        We believe there is enough excess food to feed every hungry person in our community–it just needs to be rescued. 
                        We believe that everyone should have dependable access to healthy food. We also know that climate change requires urgent action and that curbing food waste is at the top of the list.
                        This is why we won’t rest until we have No Neighbor Hungry, No Food Wasted.
                    </p>
                </div>
                <div className="foodrescue-img">
                    <img src={collectionimage} alt="Food Rescue" />
                </div>
            </div>
            <center>
                <div className='our-work'>
                    <h3>How do we do it?</h3>
                    <h1>Compassion, Volunteers, and a Whole Lot of Logistics!</h1>
                </div>
            </center>
            <div className="process-section">
                <div className="process-step">
                    <img src={rest} alt="Step 1" className="process-image" />
                    <div className="process-text">
                        <p>1. Local grocery stores, restaurants, manufacturers, and distributors let us know they have excess, good, unused food.</p>
                    </div>
                </div>
                <div className="process-step">
                    <div className="process-text">
                        <p>2.We send out our fleet of refrigerated trucks to rescue the food to prevent it from reaching a landfill.</p>
                    </div>
                    <img src={shelter} alt="Step 2" className="process-image" />
                </div>
                <div className="process-step">
                    <img src={store} alt="Step 3" className="process-image" />
                    <div className="process-text">
                        <p>3.Once that food comes into our warehouse our staff and volunteers organize it, inventory it, store it, prepare it, or package it into our trademark frozen meals.</p>
                    </div>
                </div>
                <div className="process-step">
                    <div className="process-text">
                        <p>4.These meals and other pantry staples are sent out to local churches, food banks, homeless shelters, and schools to feed the most vulnerable in our community.</p>
                    </div>
                    <img src={foodbank} alt="Step 4" className="process-image" />
                </div>
            </div>
        </>
    );
}

export default Ourmission;
