import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email);
        if (email === 'admin@gmail.com') { // Replace with your hardcoded email
            navigate('/dashboard');
        } else {
            setError('Invalid email');
        }
    };

    return (
        <div className="container">
            <center>
                <h1>Login Now</h1>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-submit">Login</button>
                </form>
            </center>
        </div>
    );
};

export default Login;
