import { useEffect, useState } from 'react';

export default function Dashboard({ onLogout }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    
    // State for the secret admin data
    const [adminData, setAdminData] = useState(null);
    const [adminError, setAdminError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('/api/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (response.ok) setData(result);
                else setError(result.error);
            } catch (err) {
                setError('Failed to connect to the server.');
            }
        };
        fetchDashboardData();
    }, []);

    // Function to attempt breaching the Admin Vault
    const fetchAdminVault = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/admin-vault', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (response.ok) {
                setAdminData(result);
                setAdminError(''); // Clear any previous errors
            } else {
                setAdminError(result.error); // E.g., "Forbidden"
            }
        } catch (err) {
            setAdminError('Failed to contact admin vault.');
        }
    };

    if (error) return <div style={{ color: 'red', textAlign: 'center' }}><h3>{error}</h3><button onClick={onLogout}>Back to Login</button></div>;
    if (!data) return <p style={{ textAlign: 'center' }}>Loading encrypted session...</p>;

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
            <h2 style={{ color: 'green' }}>✓ Access Granted</h2>
            <p>{data.message}</p>
            
            <div style={{ background: '#f4f4f4', padding: '15px', marginTop: '20px' }}>
                <h4>Your Profile</h4>
                <p><strong>Email:</strong> {data.profile.email}</p>
                <p><strong>Role:</strong> {data.profile.role}</p>
            </div>

            {/* If the user is an admin, show the secret controls */}
            {data.profile.role === 'admin' && (
                <div style={{ border: '2px solid red', padding: '15px', marginTop: '20px' }}>
                    <h3 style={{ color: 'red', margin: '0 0 10px 0' }}>⚠️ Classified Admin Panel</h3>
                    <button onClick={fetchAdminVault} style={{ background: 'black', color: 'white', padding: '8px', cursor: 'pointer' }}>
                        Extract Database Roster
                    </button>
                    
                    {adminError && <p style={{ color: 'red' }}><strong>System Alert:</strong> {adminError}</p>}
                    
                    {adminData && (
                        <div style={{ marginTop: '15px' }}>
                            <p><strong>{adminData.message}</strong></p>
                            <ul style={{ fontSize: '14px', textAlign: 'left' }}>
                                {adminData.users.map(u => (
                                    <li key={u.id}>{u.email} - [{u.role.toUpperCase()}]</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <button onClick={onLogout} style={{ marginTop: '20px', padding: '10px' }}>Secure Logout</button>
        </div>
    );
}