// Constants
const DEFAULT_MIN_YEAR = 1900;
const DEFAULT_MAX_YEAR = 3000;

export class GameManager {
    constructor() {
        this.currentSongYear = null;
        this.initializeGameListeners();
    }

    initializeGameListeners() {
        const helpIcons = document.querySelectorAll('.help-icon');
        helpIcons.forEach((icon, index) => {
            icon.addEventListener('click', () => {
                this.handleHelpIconClick(index === 0 ? 'left' : 'right');
            });
            // Ajouter un style de curseur pointer pour indiquer que c'est cliquable
            icon.style.cursor = 'pointer';
        });
    }

    setCurrentSongYear(year) {
        this.currentSongYear = year;
    }

    handleHelpIconClick(position) {
        if (!this.currentSongYear) {
            console.warn("Aucun morceau n'est en cours de lecture");
            return;
        }

        const targetYearElement = document.querySelector('.target-year');
        const targetYear = parseInt(targetYearElement.textContent);

        if (position === 'left') {
            this.evaluatePosition(DEFAULT_MIN_YEAR, targetYear, this.currentSongYear);
        } else {
            this.evaluatePosition(targetYear, DEFAULT_MAX_YEAR, this.currentSongYear);
        }
    }

    evaluatePosition(minYear, maxYear, songYear) {
        const isWithinRange = songYear >= minYear && songYear <= maxYear;
        
        if (isWithinRange) {
            console.log(`Gagné : ${minYear} <= ${songYear} <= ${maxYear}`);
        } else {
            console.log(`Perdu ! ${minYear} !<= ${songYear} !<= ${maxYear}`);
        }
    }
}