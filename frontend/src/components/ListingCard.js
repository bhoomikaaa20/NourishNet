import React from "react";
import { dietMeta, foodMeta, relativeDay } from "./foodMeta";

const ListingCard = ({ listing, onClaim }) => {
  const food = foodMeta(listing.foodType);
  const diet = dietMeta(listing.dietType);
  const until = listing.availableUntil ? relativeDay(listing.availableUntil) : "";
  const urgent = until === "today" || until === "tomorrow";

  return (
    <article className="listing-card">
      <div className={`listing-media food-${listing.foodType}`}>
        <i className={`fa-solid ${food.icon}`} aria-hidden="true" />
        {diet && (
          <span className={`diet-tag diet-${listing.dietType}`}>
            <i className={`fa-solid ${diet.icon}`} aria-hidden="true" /> {diet.label}
          </span>
        )}
      </div>
      <div className="listing-body">
        <h3>{food.label}</h3>
        <p className="listing-qty">{listing.quantity} kg available</p>
        <ul className="listing-meta">
          <li>
            <i className="fa-solid fa-location-dot" aria-hidden="true" /> {listing.city || "Location shared on confirmation"}
          </li>
          {until && (
            <li className={urgent ? "urgent" : ""}>
              <i className="fa-regular fa-clock" aria-hidden="true" /> Good until {until}
            </li>
          )}
        </ul>
        {onClaim && (
          <button type="button" className="btn btn-primary btn-block" onClick={() => onClaim(listing)}>
            Request this food
          </button>
        )}
      </div>
    </article>
  );
};

export default ListingCard;
