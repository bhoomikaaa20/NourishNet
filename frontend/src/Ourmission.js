import React from "react";
import { Link } from "react-router-dom";
import collectionimage from "./images/foodcollecting.jpg";
import rest from "./images/food.png";
import shelter from "./images/shelter.webp";
import store from "./images/storing.webp";
import foodbank from "./images/foodbank.webp";

const HERO_IMAGE =
  "https://img.freepik.com/free-photo/close-up-people-with-food-donations_23-2149182015.jpg?size=626&ext=jpg&ga=GA1.1.1856053268.1721539854&semt=ais_user";

const rescueSteps = [
  { img: rest, alt: "Surplus food sources", text: "Local grocery stores, restaurants, manufacturers, and distributors let us know they have excess, good, unused food." },
  { img: shelter, alt: "Food rescue transport", text: "We send out our fleet of refrigerated trucks to rescue the food to prevent it from reaching a landfill." },
  { img: store, alt: "Food storage", text: "Once that food comes into our warehouse our staff and volunteers organize it, inventory it, store it, prepare it, or package it into our trademark frozen meals." },
  { img: foodbank, alt: "Food bank distribution", text: "These meals and other pantry staples are sent out to local churches, food banks, homeless shelters, and schools to feed the most vulnerable in our community." },
];

const Ourmission = () => (
  <main>
    <section className="mission-hero" style={{ backgroundImage: `url('${HERO_IMAGE}')` }}>
      <div className="mission-hero-inner">
        <h1>Food Rescue</h1>
        <span className="underline" />
        <p>Rescue food. Fuel people. Help the environment.</p>
      </div>
    </section>

    <section className="section">
      <div className="split">
        <div>
          <p className="eyebrow">Our mission</p>
          <h2>Putting food on plates, not in landfill</h2>
          <h3 className="subhead">What is Food Rescue?</h3>
          <p>
            Food rescue is the practice of collecting excess edible food that would otherwise go to waste from places such as farms, grocery stores, restaurants, and dining facilities and redistributing it to those in our community who need it most.
          </p>
          <p>
            We believe there is enough excess food to feed every hungry person in our community–it just needs to be rescued. We believe that everyone should have dependable access to healthy food. We also know that climate change requires urgent action and that curbing food waste is at the top of the list. This is why we won’t rest until we have No Neighbor Hungry, No Food Wasted.
          </p>
        </div>
        <img className="rounded-img" src={collectionimage} alt="Volunteers collecting rescued food" />
      </div>
    </section>

    <section className="section tinted">
      <div className="section-head">
        <p className="eyebrow">How do we do it?</p>
        <h2>Compassion, Volunteers, and a Whole Lot of Logistics!</h2>
      </div>
      <ol className="process">
        {rescueSteps.map((p, i) => (
          <li key={p.alt} className={`process-step${i % 2 ? " reverse" : ""}`}>
            <img src={p.img} alt={p.alt} className="process-image" />
            <div className="process-text">
              <span className="process-number">Step {i + 1}</span>
              <p>{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>

    <section className="section center">
      <h2>Ready to make a difference?</h2>
      <div className="hero-actions center-actions">
        <Link to="/donate-food" className="btn btn-primary btn-lg">
          Donate food
        </Link>
        <Link to="/volunteer" className="btn btn-ghost btn-lg">
          Volunteer with us
        </Link>
      </div>
    </section>
  </main>
);

export default Ourmission;
