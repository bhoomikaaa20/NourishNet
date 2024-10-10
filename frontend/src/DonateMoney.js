import React from 'react';
import './Donate.css';
import qr from './images/qr.jpg'

const DonateMoney = () => {
  return (
    <div className="payment-container">
      <h1>Donate to Support Our Cause</h1>
      <p>Your donation helps us continue our mission to feed those in need. Every contribution makes a difference.</p>

      <div className="qr-section">
        <h2>Scan to Donate</h2>
     
        <div className="qr-placeholder">
          <img src={qr}/>
        </div>
        <p>Use your phone's camera to scan the QR code and donate securely.</p>
      </div>

      <div className="additional-info">
        
        <p>Please mention "FeedForward Donation" in the transaction reference.</p>
      </div>
    </div>
  );
}

export default DonateMoney;
