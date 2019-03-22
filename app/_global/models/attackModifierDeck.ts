import { AttackModifierCard } from './attackModifierCard';
import * as Cards from '../data/attackModifierCards';
import { Attack } from './attack';
import { Character } from './character';

export class AttackModifierDeck {
    constructor() {
        this.discard = [];
        // Instantiate with standard attack modifier deck
        this.cards = [
            Cards.Plus1.clone(),
            Cards.Plus1.clone(),
            Cards.Plus1.clone(),
            Cards.Plus1.clone(),
            Cards.Plus1.clone(),
            Cards.Minus1.clone(),
            Cards.Minus1.clone(),
            Cards.Minus1.clone(),
            Cards.Minus1.clone(),
            Cards.Minus1.clone(),
            Cards.Zero.clone(),
            Cards.Zero.clone(),
            Cards.Zero.clone(),
            Cards.Zero.clone(),
            Cards.Zero.clone(),
            Cards.Zero.clone(),
            Cards.Minus2.clone(),
            Cards.Null.clone(),
            Cards.Plus2.clone(),
            Cards.x2.clone()
        ];
        // this.cards = [
        //     Cards.Plus1.clone(),
        //     Cards.Plus2.clone(),
        //     Cards.x2.clone(),
        //     Cards.Zero.clone(),
        //     Cards.rollingFire.clone(),
        //     Cards.rollingNature.clone(),
        //     // Cards.rollingWind.clone(),
        //     // Cards.rollingIce.clone(),
        //     // Cards.rollingDarkness.clone(),
        //     // Cards.rollingLight.clone(),
        //     // Cards.rollingStun.clone(),
        //     // Cards.rollingInvisible.clone(),
        //     // Cards.rollingDisarm.clone(),
        //     Cards.rollingPoison.clone(),
        //     // Cards.rollingWound.clone(),
        //     // Cards.rollingImmobilize.clone(),
        //     // Cards.rollingStrengthen.clone(),
        //     // Cards.rollingMuddle.clone()
        //     Cards.rollingPierce3.clone(),
        //     // Cards.pull1Plus1.clone(),
        //     // Cards.push1Plus1.clone()
        // ];
    }
    requiresShuffle: boolean;
    cards: AttackModifierCard[];
    discard: AttackModifierCard[];
    character: Character;
    advantaged: boolean;
    disadvantaged: boolean;
    curseCount = 0;
    blessCount = 0;

    // Fisher-Yates algorithm shuffle
    public shuffle() {
        console.log('Shuffling deck...');
        // tslint:disable-next-line:one-variable-per-declaration
        let currentIndex = this.cards.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = this.cards[currentIndex];
            this.cards[currentIndex] = this.cards[randomIndex];
            this.cards[randomIndex] = temporaryValue;
        }
    }

    // Maps JSON cards into Attack Modifer Card objects
    public mapCards(cards) {
        this.cards = []; // Clear out existing deck if any
        cards.forEach(card => {
            const newCard = new AttackModifierCard();
            Object.assign(newCard, card);
            this.cards.push(newCard);
        });
    }

    public attack(attack: Attack) {
        if (!this.cards.length) {
            console.log(`Draw pile is empty.`);
            return null;
        }

        if (attack.committed) {
            console.log('Adding card to committed attack.');
        }

        // Apply advantage effects based on character status
        attack.disadvantaged = this.disadvantaged || attack.disadvantaged || this.character.muddled;
        attack.advantaged = this.advantaged || attack.advantaged || this.character.strengthened;

        // Draw two for advantage effects
        if (attack.disadvantaged || attack.advantaged) {
            const firstDraw = this.draw();
            const secondDraw = this.draw();
            const tempAttack1 = attack.clone();
            const tempAttack2 = attack.clone();
            firstDraw.card.modifyAttack(tempAttack1);
            secondDraw.card.modifyAttack(tempAttack2);
            const noChained = !firstDraw.card.chained && !secondDraw.card.chained;
            const bothChained = firstDraw.card.chained && secondDraw.card.chained;

            console.log(`Comparing`, tempAttack1, 'to', tempAttack2);
            if (noChained) {
                let worseAttack = null;
                let betterAttack = null;
                if (tempAttack1.value >= tempAttack2.value) {
                    betterAttack = tempAttack1.clone();
                    worseAttack = tempAttack2.clone();
                } else {
                    betterAttack = tempAttack2.clone();
                    worseAttack = tempAttack1.clone();
                }
                if (attack.advantaged) {
                    attack.map(betterAttack);
                } else {
                    attack.map(worseAttack);
                }

                console.log(betterAttack, 'attack is better than ', worseAttack, ' attack');
                attack.committed = true;

            } else if (bothChained) {
                const thirdDraw = this.rollingDraw();
                if (attack.advantaged) {
                    // Combine all attacks if advantaged
                    firstDraw.card.modifyAttack(thirdDraw.attack);
                    secondDraw.card.modifyAttack(thirdDraw.attack);
                    console.log(`Advantaged attack combines all drawn cards.`);
                }
                attack.map(thirdDraw.attack);
            } else {
                // Only one rolling modifier
                if (attack.advantaged) {
                    firstDraw.card.modifyAttack(attack);
                    secondDraw.card.modifyAttack(attack);
                    console.log(`Advantaged attack combines all drawn cards.`);
                } else {
                    if (!firstDraw.card.chained) {
                        firstDraw.card.modifyAttack(attack);
                    } else { secondDraw.card.modifyAttack(attack); }
                    console.log(`Disadvantaged attack uses non-rolling modifier.`);
                }
            }
        } else {
            // Standard rolling draw
            this.rollingDraw(attack);
        }

        attack.committed = true;
        return attack;
    }

    private draw() {
        if (!this.cards.length) {
            console.log(`Draw pile is empty... Reshuffling`);
            this.reshuffle();
        }

        const attack = new Attack(0);
        const card = this.cards.pop(); // Pop card from deck
        // card.animate(); // Play animation
        if (!card.consumed) {
            this.discard.push(card); // Put in discard pile
        } else {
            if (card.name === "Blessing") {
                this.blessCount--;
            } else if (card.name === "Curse") {
                this.curseCount--;
            }
            console.log(`Consuming ${card.name}`);
        }
        card.modifyAttack(attack); // Modify temp attack
        console.log('Drew ', card);
        return { card, attack };
    }

    private rollingDraw(attack?: Attack) {
        if (!attack) { attack = new Attack(0); }
        let card = null;
        do {
            const draw = this.draw();
            if (!draw) { return; }
            card = draw.card;
            card.modifyAttack(attack); // Modify temp attack

            // Check if card has shuffler flag on it
            if (card.shuffler) {
                this.requiresShuffle = true;
            }
        } while (card.chained);
        return { card, attack };
    }

    public reshuffle() {
        console.log('Reshuffling cards from discard...');
        this.discard.forEach(discarded => {
            if (!discarded) {
                console.warn(discarded);
            }
            this.cards.push(discarded.clone());
        });
        this.shuffle();
        this.discard = [];
        this.requiresShuffle = false;
    }

    public count(cardName: string) {
        const matches = this.cards.filter(card => {
            return card.name === cardName;
        });
        return matches.length;
    }
}