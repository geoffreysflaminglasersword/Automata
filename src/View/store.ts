import { Writable, writable } from "common";

import { v4 as uuidv4 } from "uuid";

export { };


export class Board extends Array<Lane> {
    public id: string;
    public name: string;
    public description: string;
    public createdAt: Date;
    public updatedAt: Date;
    public deletedAt: Date;
    public isDeleted: boolean;
    public isActive: boolean;
    public isArchived: boolean;
    public isLocked: boolean;
 
    constructor(columns: Lane[], name?: string, description?: string, isActive?: boolean, isArchived?: boolean, isLocked?: boolean) {
        super(...columns)
        this.id = uuidv4();
        this.name = name || "New Board";
        this.description = description || "";
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.deletedAt = null;
        this.isDeleted = false;
        this.isActive = isActive || true;
        this.isArchived = isArchived || false;
        this.isLocked = isLocked || false;
    }
}


export class Lane {
    id: string = uuidv4();
    title: string = 'Column Title';
    cards: Card[];
}

export class Card {
    id: string;
    title: string;
    contents: string;
    columnId: string;

    // constructs a new card object with the given column and optionally a title and description
    constructor(columnId: string, title?: string, contents?: string) {
        this.id = uuidv4();
        this.title = title || 'Title';
        this.contents = contents || '';
        this.columnId = columnId;
    }

}



//map of boardId to board
export const boards = new Map<string, Writable<Board>>();


const defaultColumns:Lane[] = [
    {
        id: uuidv4(),
        title: 'Column 1',
        cards: [
            {
                id: uuidv4(),
                title: 'Card 1',
                contents: 'Card 1 contents, this card has a lot more content than the other cards just to test out the scrollingCard 1 contents, this card has a lot more content than the other cards just to test out the scrolling, Card 1 contents, this card has a lot more content than the other cards just to test out the scrollingCard 1 contents, this card has a lot more content than the other cards just to test out the scrolling',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 2',
                contents: 'Card 2 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 3',
                contents: 'Card 3 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 4',
                contents: 'Card 4 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 5',
                contents: 'Card 5 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 6',
                contents: 'Card 6 contents',
                columnId: '1'
            },
            {

                id: uuidv4(),
                title: 'Card 7',
                contents: 'Card 7 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 8',
                contents: 'Card 8 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 9',
                contents: 'Card 9 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 10',
                contents: 'Card 10 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 11',
                contents: 'Card 11 contents',
                columnId: '1'
            },
            {

                id: uuidv4(),
                title: 'Card 12',
                contents: 'Card 12 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 13',

                contents: 'Card 13 contents',
                columnId: '1'

            },
            {
                id: uuidv4(),
                title: 'Card 14',
                contents: 'Card 14 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 15',
                contents: 'Card 15 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 16',
                contents: 'Card 16 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 17',
                contents: 'Card 17 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 18',
                contents: 'Card 18 contents',

                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 19',
                contents: 'Card 19 contents',
                columnId: '1'
            },
            {
                id: uuidv4(),
                title: 'Card 20',
                contents: 'Card 20 contents',
                columnId: '1'

            },

           
            
        ]
    },
    {
        id: uuidv4(),
        title: 'Column 2',
        cards: [
            {
                id: uuidv4(),
                title: 'Card 21',
                contents: 'Card 21 contents',
                columnId: '2'
            }
        ]
    },
    {
        id: uuidv4(),
        title: 'Column 3',
        cards: [
            {
                id: uuidv4(),

                title: 'Card 22',
                contents: 'Card 22 contents',
                columnId: '3'
                
            }
        ]

    }
];


export const store = writable(new Board(defaultColumns));

export const settings = writable({
  flipDurationMs : 200,
})

// map of numbers to strings, initialized with 5 default values
export const numbers = new Map([[1, 'one'], [2, 'two'], [3, 'three'], [4, 'four'], [5, 'five']]);