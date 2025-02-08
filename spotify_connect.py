import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

# Remplacez ces valeurs par vos propres identifiants
CLIENT_ID = 'eee6491d83cc44ce889bd4f1a6dfb684'
CLIENT_SECRET = '38e308009bb942c9bac6ed7d0a59fd42'

# Configuration de l'authentification
client_credentials_manager = SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

# Exemple de recherche
results = sp.search(q='year:1983', type='track', limit=1)

# Afficher le résultat
for idx, track in enumerate(results['tracks']['items']):
    print(f"Nom de la chanson : {track['name']}")
    print(f"Artiste : {track['artists'][0]['name']}")
    print(f"URI Spotify : {track['uri']}")

