export class GameManager {
    constructor() {
        this.currentSongYear = null;
        this.initializeGameListeners();
        this.restorePlacedYears();
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
        yearDiv.className = 'target-year placed-year';
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
        
        let leftYear = 1900;
        for (let i = iconIndex - 1; i >= 0; i--) {
            if (elements[i].classList.contains('target-year')) {
                leftYear = parseInt(elements[i].textContent);
                break;
            }
        }

        let rightYear = 3000;
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
            const newYearElement = this.createYearElement(this.currentSongYear);
            const newHelpIcon = this.createHelpIcon();

            clickedIcon.after(newYearElement);
            newYearElement.after(newHelpIcon);

            // Sauvegarder l'année dans la session
            if (window.sessionManager) {
                window.sessionManager.addPlacedYear(this.currentSongYear, 
                    Array.from(document.querySelectorAll('.target-year')).length);
            }

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

    restorePlacedYears() {
        const session = JSON.parse(localStorage.getItem('currentSession'));
        if (session?.placedYears) {
            const sortedYears = session.placedYears.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            sortedYears.forEach(yearData => {
                this.createYearWithIcon(yearData.year);
            });
        }
    }

    createYearWithIcon(year) {
        const yearElement = this.createYearElement(year);
        const helpIcon = this.createHelpIcon();
        
        const yearSelector = document.querySelector('.year-selector');
        const lastHelpIcon = Array.from(yearSelector.querySelectorAll('.help-icon')).pop();
        
        if (lastHelpIcon) {
            lastHelpIcon.after(yearElement);
            yearElement.after(helpIcon);
        }
    }
}
