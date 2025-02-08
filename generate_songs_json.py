import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import json

# Configuration
CLIENT_ID = 'votre_client_id_ici'
CLIENT_SECRET = 'votre_client_secret_ici'

def get_spotify_client():
    client_credentials_manager = SpotifyClientCredentials(
        client_id=CLIENT_ID, 
        client_secret=CLIENT_SECRET
    )
    return spotipy.Spotify(client_credentials_manager=client_credentials_manager)

def find_song_uri(sp, title, artist):
    query = f"track:{title} artist:{artist}"
    results = sp.search(q=query, type='track', limit=1)
    
    if results['tracks']['items']:
        return results['tracks']['items'][0]['uri']
    return None

def main():
    print("Mise à jour des URI Spotify en cours...")
    
    try:
        # Lecture du fichier songs.json existant
        with open('songs.json', 'r', encoding='utf-8') as f:
            songs_data = json.load(f)
    except FileNotFoundError:
        print("Erreur : Le fichier songs.json n'a pas été trouvé dans le répertoire courant.")
        return
    except json.JSONDecodeError:
        print("Erreur : Le fichier songs.json n'est pas correctement formaté.")
        return

    sp = get_spotify_client()
    
    # Mise à jour des URI pour chaque chanson
    for song in songs_data['songs']:
        uri = find_song_uri(sp, song['title'], song['artist'])
        if uri:
            song['uri'] = uri
    
    # Sauvegarde des modifications
    with open('songs.json', 'w', encoding='utf-8') as f:
        json.dump(songs_data, f, indent=2, ensure_ascii=False)
    
    print("Mise à jour terminée avec succès!")

if __name__ == "__main__":
    main()
