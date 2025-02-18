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
            if (!icon.hasListener) {
                icon.addEventListener('click', (e) => {
                    this.handleHelpIconClick(e.target);
                });
                icon.hasListener = true;
                icon.style.cursor = 'pointer';
            }
        });
    }

    setCurrentSongYear(year) {
        this.currentSongYear = year;
    }

    createYearElement(year) {
        const yearDiv = document.createElement('div');
        yearDiv.className = 'target-year placed-year'; // Ajout d'une classe supplémentaire
        yearDiv.textContent = year;
        return yearDiv;
    }
    
    createHelpIcon() {
        const helpIcon = document.createElement('div');
        helpIcon.className = 'help-icon';
        helpIcon.textContent = '?';
        return helpIcon;
    }

    getAdjacentYears(clickedIcon) {
        const yearSelector = document.querySelector('.year-selector');
        const elements = Array.from(yearSelector.children);
        const iconIndex = elements.indexOf(clickedIcon);
        
        // Trouver l'année à gauche
        let leftYear = 1900; // Valeur par défaut
        for (let i = iconIndex - 1; i >= 0; i--) {
            if (elements[i].classList.contains('target-year')) {
                leftYear = parseInt(elements[i].textContent);
                break;
            }
        }

        // Trouver l'année à droite
        let rightYear = 3000; // Valeur par défaut
        for (let i = iconIndex + 1; i < elements.length; i++) {
            if (elements[i].classList.contains('target-year')) {
                rightYear = parseInt(elements[i].textContent);
                break;
            }
        }

        return { leftYear, rightYear };
    }

    handleHelpIconClick(clickedIcon) {
        if (!this.currentSongYear) {
            console.warn("Aucun morceau n'est en cours de lecture");
            return;
        }

        const { leftYear, rightYear } = this.getAdjacentYears(clickedIcon);
        const isWithinRange = this.evaluatePosition(leftYear, rightYear, this.currentSongYear);
        
        if (isWithinRange) {
            // Créer les nouveaux éléments
            const newYearElement = this.createYearElement(this.currentSongYear);
            const newHelpIcon = this.createHelpIcon();

            // Insérer les éléments
            clickedIcon.after(newYearElement);
            newYearElement.after(newHelpIcon);

            // Ajouter les listeners aux nouveaux éléments
            this.addHelpIconListener('.help-icon');
        }
    }

    evaluatePosition(minYear, maxYear, songYear) {
        const isWithinRange = songYear > minYear && songYear < maxYear;
        
        if (isWithinRange) {
            console.log(`Gagné : ${minYear} <= ${songYear} <= ${maxYear}`);
        } else {
            console.log(`Perdu ! ${minYear} !<= ${songYear} !<= ${maxYear}`);
        }

        return isWithinRange;
    }
}
