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

def search_songs_by_year_and_genre(sp, year, genre):
    songs = []
    try:
        # Augmentation de la limite à 50 pour obtenir plus de résultats par recherche
        results = sp.search(q=f'year:{year} genre:{genre}', type='track', limit=50)
        
        for track in results['tracks']['items']:
            if track['popularity'] >= 40:
                song = {
                    "title": track['name'],
                    "artist": track['artists'][0]['name'],
                    "year": year,
                    "uri": track['uri']
                }
                songs.append(song)
        
        # Faire une deuxième recherche avec un offset pour obtenir plus de résultats
        if len(songs) < 50:
            results = sp.search(q=f'year:{year} genre:{genre}', type='track', limit=50, offset=50)
            for track in results['tracks']['items']:
                if track['popularity'] >= 40:
                    song = {
                        "title": track['name'],
                        "artist": track['artists'][0]['name'],
                        "year": year,
                        "uri": track['uri']
                    }
                    songs.append(song)
        
        sleep(0.1)
    except Exception as e:
        print(f"Erreur pour l'année {year} et genre {genre}: {str(e)}")
    
    return songs

def get_rock_metal_songs(sp):
    all_songs = []
    genres = ['progressive rock', 'hard rock', 'metal']
    
    # Diviser la période en trois sous-périodes pour assurer une meilleure distribution
    periods = [
        (1967, 1983),  # Période classique
        (1984, 2000),  # Période moderne
        (2001, 2017)   # Période contemporaine
    ]
    
    for start_year, end_year in periods:
        period_songs = []
        for year in range(start_year, end_year + 1):
            print(f"Recherche année {year}")
            for genre in genres:
                songs = search_songs_by_year_and_genre(sp, year, genre)
                period_songs.extend(songs)
        
        # Sélectionner environ 33 chansons par période (pour atteindre ~100 au total)
        if period_songs:
            needed_songs = min(34, len(period_songs))
            all_songs.extend(random.sample(period_songs, needed_songs))
    
    # Si nous n'avons pas assez de chansons, effectuer des recherches supplémentaires
    while len(all_songs) < 100:
        year = random.randint(1967, 2017)
        genre = random.choice(genres)
        additional_songs = search_songs_by_year_and_genre(sp, year, genre)
        
        for song in additional_songs:
            if song not in all_songs:
                all_songs.append(song)
                if len(all_songs) >= 100:
                    break
    
    # Si nous avons trop de chansons, sélectionner aléatoirement 100
    if len(all_songs) > 100:
        all_songs = random.sample(all_songs, 100)
    
    return all_songs

def main():
    print("Génération de la playlist Rock et Metal via Spotify.")
    
    try:
        sp = get_spotify_client()
        songs = get_rock_metal_songs(sp)
        
        output = {
            "playlist_name": "Prog rock, Hard rock, Metal",
            "songs": songs
        }
        
        with open('rock_metal_playlist.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"Mise à jour terminée avec succès! {len(songs)} chansons ajoutées.")
        
    except Exception as e:
        print(f"Une erreur est survenue : {str(e)}")

if __name__ == "__main__":
    main()
