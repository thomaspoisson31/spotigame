export class GameManager {
    constructor() {
        this.currentSongYear = null;
        this.initializeGameListeners();
    }

    initializeGameListeners() {
        this.addHelpIconListener('.help-icon');
    }

    addHelpIconListener(selector) {
        const helpIcons = document.querySelectorAll(selector);
        helpIcons.forEach((icon) => {
            if (!icon.hasListener) {  // Éviter les doublons d'événements
                icon.addEventListener('click', (e) => {
                    const position = this.getIconPosition(e.target);
                    this.handleHelpIconClick(position, e.target);
                });
                icon.hasListener = true;
                icon.style.cursor = 'pointer';
            }
        });
    }

    getIconPosition(icon) {
        const yearSelector = document.querySelector('.year-selector');
        const icons = Array.from(yearSelector.querySelectorAll('.help-icon'));
        return icons.indexOf(icon);
    }

    setCurrentSongYear(year) {
        this.currentSongYear = year;
    }

    createYearElement(year) {
        const yearDiv = document.createElement('div');
        yearDiv.className = 'target-year';
        yearDiv.textContent = year;
        return yearDiv;
    }

    createHelpIcon() {
        const helpIcon = document.createElement('div');
        helpIcon.className = 'help-icon';
        helpIcon.textContent = '?';
        return helpIcon;
    }

    handleHelpIconClick(position, clickedIcon) {
        if (!this.currentSongYear) {
            console.warn("Aucun morceau n'est en cours de lecture");
            return;
        }

        const yearSelector = document.querySelector('.year-selector');
        const years = Array.from(yearSelector.querySelectorAll('.target-year'))
            .map(el => parseInt(el.textContent));

        let minYear, maxYear;
        if (position === 0) { // Click gauche
            minYear = DEFAULT_MIN_YEAR;
            maxYear = years[0];
        } else { // Click droite
            minYear = years[years.length - 1];
            maxYear = DEFAULT_MAX_YEAR;
        }

        const isWithinRange = this.evaluatePosition(minYear, maxYear, this.currentSongYear);
        
        if (isWithinRange) {
            // Créer les nouveaux éléments
            const newYearElement = this.createYearElement(this.currentSongYear);
            const newHelpIcon = this.createHelpIcon();

            if (position === 0) { // Insertion à gauche
                clickedIcon.before(newHelpIcon);
                clickedIcon.before(newYearElement);
            } else { // Insertion à droite
                clickedIcon.after(newYearElement);
                newYearElement.after(newHelpIcon);
            }

            // Ajouter les listeners aux nouveaux éléments
            this.addHelpIconListener('.help-icon');
        }
    }

    evaluatePosition(minYear, maxYear, songYear) {
        const isWithinRange = songYear >= minYear && songYear <= maxYear;
        
        if (isWithinRange) {
            console.log(`Gagné : ${minYear} <= ${songYear} <= ${maxYear}`);
        } else {
            console.log(`Perdu ! ${minYear} !<= ${songYear} !<= ${maxYear}`);
        }

        return isWithinRange;
    }
}

const DEFAULT_MIN_YEAR = 1900;
const DEFAULT_MAX_YEAR = 3000;
