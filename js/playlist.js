export let playlists = [];

export async function loadPlaylists() {
    try {
        console.log('Début du chargement des playlists...');
        
        const configResponse = await fetch('playlist_config.json');
        if (!configResponse.ok) {
            throw new Error('Impossible de charger le fichier de configuration');
        }
        const config = await configResponse.json();
        const files = config.playlist_files;
        
        console.log('Fichiers à charger depuis la configuration:', files);
        
        const loadedPlaylists = await Promise.all(
            files.map(async (file) => {
                try {
                    console.log('Chargement du fichier:', file);
                    const fileResponse = await fetch(file);
                    if (!fileResponse.ok) {
                        console.log(`Fichier ${file} non trouvé, ignoré`);
                        return null;
                    }
                    const data = await fileResponse.json();
                    
                    if (!data.playlist_name || !Array.isArray(data.songs)) {
                        console.log(`Format invalide pour ${file}, ignoré`);
                        return null;
                    }
                    
                    return {
                        filename: file,
                        name: data.playlist_name,
                        songs: data.songs
                    };
                } catch (error) {
                    console.log(`Erreur pour ${file}, ignoré:`, error);
                    return null;
                }
            })
        );
        
        const validPlaylists = loadedPlaylists.filter(playlist => playlist !== null);
        console.log('Playlists valides chargées:', validPlaylists);
        playlists = validPlaylists;
        return validPlaylists;
        
    } catch (error) {
        console.error('Erreur chargement playlists:', error);
        return [];
    }
}
