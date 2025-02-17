// auth.js
export async function checkAndRefreshToken() {
    console.log('=== Début vérification token ===');
    
    const token = localStorage.getItem('spotify_token');
    const timestamp = localStorage.getItem('token_timestamp');
    const expiresIn = localStorage.getItem('token_expires_in');
    const currentTime = Date.now();

    console.log({
        hasToken: !!token,
        timestamp: timestamp ? new Date(parseInt(timestamp)) : null,
        expiresIn: expiresIn,
        currentTime: currentTime
    });

    // Si pas de token, rediriger vers l'authentification
    if (!token) {
        console.log('❌ Token manquant');
        window.location.href = 'auth.html';
        return false;
    }

    // Vérifier si le token est expiré
    if (timestamp && expiresIn) {
        const expirationTime = parseInt(timestamp) + (parseInt(expiresIn) * 1000);
        if (currentTime > expirationTime) {
            console.log('❌ Token expiré');
            redirectToAuth();
            return false;
        }
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
            if (response.status === 401) {
                redirectToAuth();
            }
            return false;
        }

        console.log('✅ Token valide');
        return true;
    } catch (error) {
        console.error('❌ Erreur vérification token:', error);
        redirectToAuth();
        return false;
    }
}

function redirectToAuth() {
    // Nettoyer le localStorage avant la redirection
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('token_expires_in');
    
    // Construire l'URL d'authentification Spotify
    const clientId = 'eee6491d83cc44ce889bd4f1a6dfb684'; // Remplacez par votre Client ID
    const redirectUri = encodeURIComponent(window.location.origin + '/auth.html');
    const scopes = encodeURIComponent('streaming user-read-email user-read-private user-modify-playback-state');
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}&show_dialog=true`;
    
    window.location.href = authUrl;
}

export function handleAuthResponse() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (token) {
        localStorage.setItem('spotify_token', token);
        localStorage.setItem('token_timestamp', Date.now().toString());
        localStorage.setItem('token_expires_in', expiresIn || '3600');
        
        // Rediriger vers la page principale
        window.location.href = 'index.html';
    } else {
        console.error('Pas de token dans la réponse');
        redirectToAuth();
    }
}

export function getCurrentToken() {
    return localStorage.getItem('spotify_token');
}
