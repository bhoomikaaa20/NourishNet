import React from "react";
import qr from "./images/qr.jpg";
import { PageHeader } from "./components/Form";

const DonateMoney = () => (
  <main>
    <PageHeader
      eyebrow="Give Money"
      title="Donate to support our cause"
      subtitle="Your donation helps us continue our mission to feed those in need. Every contribution makes a difference."
    />
    <section className="section narrow">
      <div className="form-card flat qr-card">
        <h2>Scan to donate</h2>
        <div className="qr-frame">
          <img src={qr} alt="QR code for donating via UPI" />
        </div>
        <p>Use your phone's camera or payment app to scan the QR code and donate securely.</p>
        <p className="note">
          <i className="fa-solid fa-circle-info" aria-hidden="true" /> Please mention “NourishNet Donation” in the transaction reference.
        </p>
      </div>
    </section>
  </main>
);

export default DonateMoney;
