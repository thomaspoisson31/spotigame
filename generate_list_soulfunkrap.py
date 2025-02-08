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
        # Recherche avec année et genre
        query = f'year:{year} genre:{genre}'
        results = sp.search(q=query, type='track', limit=50)
        
        for track in results['tracks']['items']:
            if track['popularity'] >= 60:  # Seuil de popularité modifié à 60
                song = {
                    "title": track['name'],
                    "artist": track['artists'][0]['name'],
                    "year": year,
                    "genre": genre,
                    "popularity": track['popularity'],
                    "uri": track['uri']
                }
                songs.append(song)
        
        sleep(0.1)  # Pour éviter de dépasser les limites d'API
    except Exception as e:
        print(f"Erreur pour l'année {year} et genre {genre}: {str(e)}")
    
    return songs

def get_funk_soul_rap_songs(sp):
    all_songs = []
    genres = ['funk', 'soul', 'rap']
    years_range = range(1970, 2025)  # Période modifiée selon vos critères
    songs_per_year = 2  # Pour avoir une répartition homogène (environ 2 chansons par année)
    
    for year in years_range:
        print(f"Recherche année {year}")
        for genre in genres:
            year_genre_songs = search_songs_by_year_and_genre(sp, year, genre)
            if year_genre_songs:
                all_songs.extend(year_genre_songs)

    # Si nous avons plus de 100 chansons, nous sélectionnons de manière équilibrée
    if len(all_songs) > 100:
        # Grouper les chansons par décennie pour assurer une répartition homogène
        songs_by_decade = {}
        for song in all_songs:
            decade = (song['year'] // 10) * 10
            if decade not in songs_by_decade:
                songs_by_decade[decade] = []
            songs_by_decade[decade].append(song)
        
        # Sélectionner un nombre égal de chansons par décennie
        selected_songs = []
        songs_per_decade = 100 // len(songs_by_decade)
        
        for decade in sorted(songs_by_decade.keys()):
            decade_songs = songs_by_decade[decade]
            selected = random.sample(decade_songs, min(songs_per_decade, len(decade_songs)))
            selected_songs.extend(selected)
        
        # Compléter jusqu'à 100 si nécessaire
        while len(selected_songs) < 100 and all_songs:
            remaining = random.choice(all_songs)
            if remaining not in selected_songs:
                selected_songs.append(remaining)
                
        return selected_songs[:100]
    
    return all_songs

def main():
    print("Génération de la playlist Funk, Soul, Rap via Spotify.")
    
    try:
        sp = get_spotify_client()
        songs = get_funk_soul_rap_songs(sp)
        
        output = {
            "playlist_name": "Popular Funk, Soul, Rap",
            "total_songs": len(songs),
            "songs": songs
        }
        
        with open('funk_soul_rap_playlist.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"Mise à jour terminée avec succès! {len(songs)} chansons ajoutées.")
        
    except Exception as e:
        print(f"Une erreur est survenue : {str(e)}")

if __name__ == "__main__":
    main()
