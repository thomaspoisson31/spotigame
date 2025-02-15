export async function checkAndRefreshToken() {
    console.log('Vérification du token...');
    
    const token = localStorage.getItem('spotify_token');
    const timestamp = localStorage.getItem('token_timestamp');
    const expiresIn = localStorage.getItem('token_expires_in');
    
    if (!token || !timestamp || !expiresIn) {
        console.log('Informations de token manquantes');
        return false;
    }

    const now = Date.now();
    const tokenAge = now - parseInt(timestamp);
    
    // Si le token est expiré ou va expirer dans les 5 minutes
    if (tokenAge >= (parseInt(expiresIn) * 1000 - 300000)) {
        console.log('Token expiré ou proche de l\'expiration');
        return false;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log('Vérification du token échouée');
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


