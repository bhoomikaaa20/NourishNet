import React from "react";
import { Link } from "react-router-dom";
import { homeFor, useAuth } from "./components/AuthContext";

const Forbidden = () => {
  const { user } = useAuth();
  return (
    <main className="section center">
      <p className="eyebrow">Error 403</p>
      <h1>You don't have access to this page</h1>
      <p className="muted">Your account isn't allowed to view it. If you think this is a mistake, please contact us.</p>
      <Link to={homeFor(user)} className="btn btn-primary">
        Go to my page
      </Link>
    </main>
  );
};

export default Forbidden;
