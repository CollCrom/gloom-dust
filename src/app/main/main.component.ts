import { Component, OnInit, HostListener } from '@angular/core';
import { Character } from '../_global/models/character';
import { Router } from '@angular/router';
import { Constants } from '../_global/constants';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
    public characters: Character[] = [];
    public windowHeight: number;
    public containerHeight: number;
    public createCharacterActions = [
        { label: 'Get Started', route: 'characterCreation' }
    ];

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.adjustHeights();
    }

    constructor(private router: Router) { }

    ngOnInit() {
        this.adjustHeights();
        const characterStorage = localStorage.getItem('characters');
        if (characterStorage) {
            const characterKeys = characterStorage.split(',');
            characterKeys.forEach(characterKey => {
                const characterJson = localStorage.getItem(`char:${characterKey}`);
                if (!characterJson) { return; }
                const character = JSON.parse(characterJson);
                this.characters.push(character);
            });
        }
    }

    // Event listener from child
    onCharacterRemove(removedCharacterName: string) {
        const removedIndex = this.characters.findIndex((character) => {
            return character.name == removedCharacterName;
        });
        this.characters.splice(removedIndex, 1);
    }

    public createCharacter() {
        this.router.navigate(['characterCreation']);
    }

    private adjustHeights() {
        this.windowHeight = window.innerHeight;
        this.containerHeight = this.windowHeight - Constants.TOP_BAR_HEIGHT;
    }

}
