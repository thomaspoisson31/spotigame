export class SessionManager {
    constructor() {
        this.currentSession = null;
        this.loadCurrentSession();
        this.initializeEventListeners();
        this.initializeDebugButton();  
    }

    initializeEventListeners() {
        // Bouton pour ouvrir la modale
        const addButton = document.getElementById('add-button');
        const modal = document.getElementById('sessionModal');
        const cancelButton = document.getElementById('cancelSession');
        const sessionForm = document.getElementById('sessionForm');
        const sessionNameInput = document.getElementById('sessionName');

        // Gestionnaire pour le bouton "+"
        addButton.addEventListener('click', () => {
            sessionNameInput.value = this.getDefaultSessionName();
            modal.style.display = 'block';
        });

        // Fermeture de la modale
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
        sessionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sessionName = sessionNameInput.value.trim();
            
            if (sessionName) {
                this.createNewSession(sessionName);
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

    createNewSession(sessionName) {
        const sessionData = {
            name: sessionName,
            createdAt: new Date().toISOString(),
            tracks: []
        };

        // Sauvegarder dans localStorage
        localStorage.setItem('currentSession', JSON.stringify(sessionData));
        this.currentSession = sessionData;
        this.updateSessionDisplay();
        console.log(`Session "${sessionName}" créée avec succès`);
    }

    loadCurrentSession() {
        const savedSession = localStorage.getItem('currentSession');
        if (savedSession) {
            this.currentSession = JSON.parse(savedSession);
            this.updateSessionDisplay();
        }
    }

    updateSessionDisplay() {
        const sessionDisplay = document.getElementById('current-session');
        if (sessionDisplay && this.currentSession) {
            sessionDisplay.textContent = this.currentSession.name;
        }
    }

    // Méthode pour ajouter une piste à la session courante
    addTrackToSession(track) {
        if (!this.currentSession) return;

        this.currentSession.tracks.push(track);
        localStorage.setItem('currentSession', JSON.stringify(this.currentSession));
    }


    debugSession() {
    console.log('=== Contenu de la session ===');
    console.log('Nom:', this.currentSession?.name);
    console.log('Date création:', this.currentSession?.createdAt);
    console.log('Nombre de pistes:', this.currentSession?.tracks?.length);
    console.log('Pistes:', this.currentSession?.tracks);
    console.log('========================');
    }

    // Méthode pour obtenir un résumé de la session
    getSessionSummary() {
        if (!this.currentSession) {
            return 'Aucune session active';
        }
        return {
            name: this.currentSession.name,
            createdAt: new Date(this.currentSession.createdAt).toLocaleString(),
            trackCount: this.currentSession.tracks.length,
            tracks: this.currentSession.tracks
        };
    }

    initializeDebugButton() {
        const debugButton = document.querySelector('.collapsible-debug');
        if (debugButton) {
            const debugContent = debugButton.nextElementSibling;
            const sessionDebugButton = document.createElement('button');
            sessionDebugButton.textContent = 'Afficher Session';
            sessionDebugButton.onclick = () => {
                this.debugSession(); // Maintenant 'this' référence correctement l'instance
            };
            debugContent.appendChild(sessionDebugButton);
        }
    }


}


