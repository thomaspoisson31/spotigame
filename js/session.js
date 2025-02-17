export class SessionManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Bouton pour ouvrir la modale
        const addButton = document.getElementById('add-button');
        const modal = document.getElementById('sessionModal');
        const cancelButton = document.getElementById('cancelSession');
        const sessionForm = document.getElementById('sessionForm');
        const sessionNameInput = document.getElementById('sessionName');

        addButton.addEventListener('click', () => {
            sessionNameInput.value = this.getDefaultSessionName();
            modal.style.display = 'block';
        });

        // Fermer la modale
        cancelButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Clic en dehors de la modale
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Soumission du formulaire
        sessionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sessionName = sessionNameInput.value.trim();
            
            if (sessionName) {
                await this.createNewSession(sessionName);
                modal.style.display = 'none';
            }
        });
    }

    getDefaultSessionName() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `Session ${day}-${month}-${year}`;
    }

    async createNewSession(sessionName) {
        try {
            const filename = `Morceaux ${sessionName}.json`;
            const sessionData = {
                name: sessionName,
                createdAt: new Date().toISOString(),
                tracks: []
            };

            // Sauvegarder le fichier
            const blob = new Blob([JSON.stringify(sessionData, null, 2)], 
                                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Créer un lien de téléchargement
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`Session "${sessionName}" créée avec succès`);
        } catch (error) {
            console.error('Erreur lors de la création de la session:', error);
            alert('Erreur lors de la création de la session');
        }
    }
}
