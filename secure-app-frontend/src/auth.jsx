
import { useState } from 'react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Decide which backend route to hit based on the form state
        const endpoint = isLogin ? '/api/login' : '/api/register';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (isLogin) {
                    // Security Note: Storing JWT in localStorage is common for beginners,
                    // though HTTP-only cookies are better for strict production security.
                    localStorage.setItem('token', data.token);
                    setMessage('Login successful! Token saved.');
                } else {
                    setMessage('Registration successful! You can now log in.');
                    setIsLogin(true); // Switch to login view
                }
            } else {
                // Display the error from our backend (e.g., "Invalid Credentials")
                setMessage(data.error || 'Something went wrong');
            }
        } catch (error) {
            setMessage('Server error. Is your backend running?');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>{isLogin ? 'Log In' : 'Register'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '10px' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '10px' }}
                />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
                    {isLogin ? 'Secure Login' : 'Create Account'}
                </button>
            </form>

            <p style={{ marginTop: '20px', color: 'blue' }}>{message}</p>

            <button 
                onClick={() => setIsLogin(!isLogin)} 
                style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer', marginTop: '10px' }}
            >
                {isLogin ? "Need an account? Register" : "Already have an account? Log In"}
            </button>
        </div>
    );
}
