const TOKEN_KEYS = {
    TOKEN: 'spotify_token',
    TIMESTAMP: 'token_timestamp',
    EXPIRES_IN: 'token_expires_in',
    JUST_AUTHENTICATED: 'just_authenticated'
};

// Fonction utilitaire pour vérifier si une chaîne est valide
const isValidString = (str) => typeof str === 'string' && str.length > 0;

export async function checkAndRefreshToken() {
    console.log('Vérification du token...');
    
    try {
        const token = localStorage.getItem(TOKEN_KEYS.TOKEN);
        const timestamp = localStorage.getItem(TOKEN_KEYS.TIMESTAMP);
        const expiresIn = localStorage.getItem(TOKEN_KEYS.EXPIRES_IN);
        
        if (!isValidString(token) || !isValidString(timestamp) || !isValidString(expiresIn)) {
            console.log('Informations de token manquantes ou invalides');
            return false;
        }

        const now = Date.now();
        const tokenAge = now - parseInt(timestamp, 10);
        const expirationTime = parseInt(expiresIn, 10) * 1000;
        const bufferTime = 300000; // 5 minutes en millisecondes
        
        // Vérification de l'expiration avec buffer
        if (tokenAge >= (expirationTime - bufferTime)) {
            console.log('Token expiré ou proche de l\'expiration');
            return false;
        }

        // Vérification de la validité auprès de l'API
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log(`Vérification du token échouée: ${response.status}`);
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

export function handleAuthResponse() {
    try {
        const hashParams = new URLSearchParams(window.location.hash.substr(1));
        const token = hashParams.get('access_token');
        const expiresIn = hashParams.get('expires_in');

        if (!isValidString(token) || !isValidString(expiresIn)) {
            console.error('Réponse d\'authentification invalide');
            return false;
        }

        localStorage.setItem(TOKEN_KEYS.TOKEN, token);
        localStorage.setItem(TOKEN_KEYS.TIMESTAMP, Date.now().toString());
        localStorage.setItem(TOKEN_KEYS.EXPIRES_IN, expiresIn);
        localStorage.setItem(TOKEN_KEYS.JUST_AUTHENTICATED, 'true');
        
        window.location.href = 'index.html';
        return true;
    } catch (error) {
        console.error('Erreur lors du traitement de la réponse d\'authentification:', error);
        return false;
    }
}

// Fonction utilitaire pour obtenir le token actuel
export function getCurrentToken() {
    return localStorage.getItem(TOKEN_KEYS.TOKEN);
}
