export const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        // Basic token validation (check if expired)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('authToken');
            return null;
        }
        return token;
    } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('authToken');
        return null;
    }
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};

export const refreshToken = async () => {
    try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('No refresh token');

        const response = await fetch('https://k-to-drinks.onrender.com/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });

        if (!response.ok) throw new Error('Token refresh failed');

        const data = await response.json();
        localStorage.setItem('authToken', data.access);
        return data.access;
    } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        return null;
    }
};
