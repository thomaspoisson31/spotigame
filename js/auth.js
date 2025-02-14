// auth.js
const CLIENT_ID = 'votre_client_id';
const CLIENT_SECRET = 'votre_client_secret';
const REDIRECT_URI = 'votre_redirect_uri';
const SCOPES = 'playlist-modify-public playlist-modify-private';

function getAuthURL() {
    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

async function getAccessToken(code) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    });
    const data = await response.json();
    return data.access_token;
}

export { getAuthURL, getAccessToken };
