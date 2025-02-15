export async function checkAndRefreshToken() {
    console.log('Vérification du token...');
    
    const justAuthenticated = localStorage.getItem('just_authenticated');
    if (justAuthenticated === 'true') {
        localStorage.removeItem('just_authenticated');
        return true;
    }
    
    const token = localStorage.getItem('spotify_token');
    const timestamp = localStorage.getItem('token_timestamp');
    const expiresIn = localStorage.getItem('token_expires_in');
    
    if (!token) {
        console.log('Aucun token trouvé');
        window.location.href = 'auth.html';
        return false;
    }

    const now = Date.now();
    const tokenAge = now - parseInt(timestamp);
    if (tokenAge >= parseInt(expiresIn) * 1000) {
        console.log('Token expiré');
        window.location.href = 'auth.html';
        return false;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            console.log('Token invalide');
            window.location.href = 'auth.html';
            return false;
        }
        
        console.log('Token valide');
        return true;
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        return false;
    }
}

export function invalidateToken() {
    localStorage.setItem('spotify_token', 'invalid_token');
    console.log('Token invalidé');
    checkAndRefreshToken();
}

export function expireToken() {
    localStorage.setItem('token_timestamp', '0');
    localStorage.setItem('token_expires_in', '0');
    console.log('Token expiré');
    checkAndRefreshToken();
}

export function removeToken() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('token_expires_in');
    console.log('Token supprimé');
    checkAndRefreshToken();
}
