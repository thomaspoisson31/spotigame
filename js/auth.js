const TOKEN_KEYS = {
    TOKEN: 'spotify_token',
    TIMESTAMP: 'token_timestamp',
    EXPIRES_IN: 'token_expires_in',
    JUST_AUTHENTICATED: 'just_authenticated'
};

// Fonction utilitaire pour vérifier si une chaîne est valide
const isValidString = (str) => typeof str === 'string' && str.length > 0;

export async function checkAndRefreshToken() {
    console.log('=== Début vérification token ===');
    
    const token = localStorage.getItem('spotify_token');
    const timestamp = localStorage.getItem('token_timestamp');
    const expiresIn = localStorage.getItem('token_expires_in');
    
    console.log({
        hasToken: !!token,
        timestamp: timestamp,
        expiresIn: expiresIn,
        currentTime: Date.now()
    });

    if (!token || !timestamp || !expiresIn) {
        console.log('❌ Informations de token manquantes');
        return false;
    }

    const now = Date.now();
    const tokenAge = now - parseInt(timestamp);
    const expirationTime = parseInt(expiresIn) * 1000;

    console.log({
        tokenAge: tokenAge / 1000 + ' secondes',
        expirationTime: expirationTime / 1000 + ' secondes',
        remaining: (expirationTime - tokenAge) / 1000 + ' secondes'
    });

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.log(`❌ Vérification API échouée: ${response.status}`);
            return false;
        }

        console.log('✅ Token valide');
        return true;
    } catch (error) {
        console.error('❌ Erreur vérification token:', error);
        return false;
    }
}

export function handleAuthResponse() {
    console.log('=== Traitement réponse auth ===');
    
    const urlParams = new URLSearchParams(window.location.hash.substr(1));
    const token = urlParams.get('access_token');
    const expiresIn = urlParams.get('expires_in');

    console.log({
        hasToken: !!token,
        expiresIn: expiresIn
    });

    if (token) {
        localStorage.setItem('spotify_token', token);
        localStorage.setItem('token_timestamp', Date.now().toString());
        localStorage.setItem('token_expires_in', expiresIn);
        localStorage.setItem('just_authenticated', 'true');
        
        console.log('✅ Token sauvegardé');
        window.location.href = 'index.html';
    } else {
        console.log('❌ Pas de token dans la réponse');
    }
}


export function invalidateToken() {
    try {
        localStorage.setItem(TOKEN_KEYS.TOKEN, 'invalid_token');
        console.log('Token invalidé');
        return checkAndRefreshToken();
    } catch (error) {
        console.error('Erreur lors de l\'invalidation du token:', error);
        return false;
    }
}

export function expireToken() {
    try {
        localStorage.setItem(TOKEN_KEYS.TIMESTAMP, '0');
        localStorage.setItem(TOKEN_KEYS.EXPIRES_IN, '0');
        console.log('Token expiré');
        return checkAndRefreshToken();
    } catch (error) {
        console.error('Erreur lors de l\'expiration du token:', error);
        return false;
    }
}

export function removeToken() {
    try {
        for (const key of Object.values(TOKEN_KEYS)) {
            localStorage.removeItem(key);
        }
        console.log('Token et informations associées supprimés');
        return checkAndRefreshToken();
    } catch (error) {
        console.error('Erreur lors de la suppression du token:', error);
        return false;
    }
}

// Fonction utilitaire pour obtenir le token actuel
export function getCurrentToken() {
    return localStorage.getItem(TOKEN_KEYS.TOKEN);
}
