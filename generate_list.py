import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import json
import random
from time import sleep

CLIENT_ID = 'eee6491d83cc44ce889bd4f1a6dfb684'
CLIENT_SECRET = '38e308009bb942c9bac6ed7d0a59fd42'

def get_spotify_client():
    client_credentials_manager = SpotifyClientCredentials(
        client_id=CLIENT_ID, 
        client_secret=CLIENT_SECRET
    )
    return spotipy.Spotify(client_credentials_manager=client_credentials_manager)

def search_songs_by_year(sp, year):
    songs = []
    try:
        results = sp.search(q=f'year:{year}', type='track', limit=50)
        
        for track in results['tracks']['items']:
            if track['popularity'] >= 65:
                song = {
                    "title": track['name'],
                    "artist": track['artists'][0]['name'],
                    "year": year,
                    "uri": track['uri']
                }
                songs.append(song)
        
        sleep(0.1)
    except Exception as e:
        print(f"Erreur pour l'année {year}: {str(e)}")
    
    return songs

def get_popular_songs(sp):
    core_period_songs = []
    other_period_songs = []
    
    print("Recherche des chansons de la période principale (1965-1995).")
    for year in range(1965, 1996):
        print(f"Recherche année {year}.")
        year_songs = search_songs_by_year(sp, year)
        core_period_songs.extend(year_songs)
    
    print("Recherche des chansons des autres périodes.")
    for year in list(range(1950, 1965)) + list(range(1996, 2025)):
        print(f"Recherche année {year}.")
        year_songs = search_songs_by_year(sp, year)
        other_period_songs.extend(year_songs)
    
    needed_core = 60
    needed_other = 40
    
    selected_songs = []
    
    if len(core_period_songs) >= needed_core:
        selected_songs.extend(random.sample(core_period_songs, needed_core))
    else:
        print(f"Attention: seulement {len(core_period_songs)} chansons trouvées pour la période principale")
        selected_songs.extend(core_period_songs)
    
    if len(other_period_songs) >= needed_other:
        selected_songs.extend(random.sample(other_period_songs, needed_other))
    else:
        print(f"Attention: seulement {len(other_period_songs)} chansons trouvées pour les autres périodes")
        selected_songs.extend(other_period_songs)
    
    random.shuffle(selected_songs)
    return selected_songs

def main():
    print("Génération de la liste des chansons via Spotify.")
    
    try:
        sp = get_spotify_client()
        songs = get_popular_songs(sp)
        
        output = {
            "playlist_name": "Hits UK et US",
            "songs": songs
        }
        
        with open('songs.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"Mise à jour terminée avec succès! {len(songs)} chansons ajoutées.")
        
    except Exception as e:
        print(f"Une erreur est survenue : {str(e)}")

if __name__ == "__main__":
    main()
