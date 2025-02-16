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
    let timestamp = localStorage.getItem('token_timestamp');
    let expiresIn = localStorage.getItem('token_expires_in');
    
    // Si on a un token mais pas de timestamp/expires_in, on les initialise
    if (token && (!timestamp || !expiresIn)) {
        console.log('Initialisation des informations de token manquantes');
        timestamp = Date.now().toString();
        expiresIn = '3600'; // 1 heure par défaut
        localStorage.setItem('token_timestamp', timestamp);
        localStorage.setItem('token_expires_in', expiresIn);
    }

    console.log({
        hasToken: !!token,
        timestamp: timestamp ? new Date(parseInt(timestamp)) : null,
        expiresIn: expiresIn,
        currentTime: Date.now()
    });

    if (!token) {
        console.log('❌ Token manquant');
        return false;
    }

    try {
        // Vérification du token avec l'API Spotify
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
    
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in') || '3600';

    console.log({
        hasToken: !!token,
        expiresIn: expiresIn
    });

    if (token) {
        // Sauvegarde du token et des informations associées
        localStorage.setItem('spotify_token', token);
        localStorage.setItem('token_timestamp', Date.now().toString());
        localStorage.setItem('token_expires_in', expiresIn);
        localStorage.setItem('just_authenticated', 'true');
        
        console.log('✅ Token et informations sauvegardés');
        window.location.href = 'index.html';
    } else {
        console.log('❌ Pas de token dans la réponse');
    }
}

// Fonction utilitaire pour vérifier si le token est expiré
function isTokenExpired() {
    const timestamp = localStorage.getItem('token_timestamp');
    const expiresIn = localStorage.getItem('token_expires_in');
    
    if (!timestamp || !expiresIn) return true;
    
    const now = Date.now();
    const tokenAge = now - parseInt(timestamp);
    const expirationTime = parseInt(expiresIn) * 1000;
    
    return tokenAge >= expirationTime;
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
