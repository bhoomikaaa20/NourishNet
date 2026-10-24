import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <main className="section center">
    <p className="eyebrow">Error 404</p>
    <h1>We can't find that page</h1>
    <p className="muted">The link may be broken or the page may have moved.</p>
    <Link to="/" className="btn btn-primary">
      Back to home
    </Link>
  </main>
);

export default NotFound;
