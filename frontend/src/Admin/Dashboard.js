import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css"; // Import the CSS file

const Dashboard = () => {
  const [requests, setRequests] = useState([]); // Initialize as empty array
  const [contacts, setContacts] = useState([]); // Initialize as empty array
  const [donations, setDonations] = useState([]); // Initialize as empty array
  const [connections, setConnections] = useState([]); // Initialize as empty array
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("http://localhost:8087/api/dashboard");

        // Check the structure of the response and set state accordingly
        setRequests(response.data.requests || []); // Fallback to empty array if undefined
        setContacts(response.data.contacts || []); // Fallback to empty array if undefined
        setDonations(response.data.donations || []); // Fallback to empty array if undefined
        setConnections(response.data.connections || []); // Fallback to empty array if undefined
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch data.");
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="admin-content">
        {/* Request Form Details */}
        <h2>Request Form Details</h2>
        {error && <p className="error-message">{error}</p>}
        {requests.length === 0 ? (
          <p>No requests available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Email</th>
                <th>Urgency</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>{request.name}</td>
                  <td>{request.contactNumber}</td>
                  <td>{request.email}</td>
                  <td>{request.urgency}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Contact Form Details */}
        <h2>Contact Form Details</h2>
        {contacts.length === 0 ? (
          <p>No contact forms available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Comments</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact._id}>
                  <td>{contact.firstName}</td>
                  <td>{contact.lastName}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.comments}</td>
                  <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Donations Details */}
        <h2>Donation Details</h2>
        {donations.length === 0 ? (
          <p>No donations available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Email</th>
                <th>Address</th>
                <th>Quantity (kg)</th>
                <th>Food Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation._id}>
                  <td>{donation.name}</td>
                  <td>{donation.contactNumber}</td>
                  <td>{donation.email}</td>
                  <td>{donation.address}</td>
                  <td>{donation.quantity}</td>
                  <td>{donation.foodType}</td>
                  <td>{new Date(donation.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Connections Details */}
        <h2>Connection Details</h2>
        {connections.length === 0 ? (
          <p>No connections available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((connection) => (
                <tr key={connection._id}>
                  <td>{connection.email}</td>
                  <td>{new Date(connection.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
