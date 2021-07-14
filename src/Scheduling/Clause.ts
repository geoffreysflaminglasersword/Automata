import * as DU from 'src/Utils';
import * as chrono from 'chrono-node';
import * as moment from 'moment';

import { getUniqueArray, hasDuplicates, isNullOrWhitespace, zip } from 'src/Utils';

import { ParsingComponents } from 'chrono-node/dist/results';
import RRule from 'rrule';
import { TFromArray } from 'src/common';
import { eHOLIDAY } from 'src/Scheduling/holidays';

//TODO: add clauses: before, after, remind
export const CLAUSES = ["starting", "ending", "every"] as const;
export const META_CLAUSES = ["except", "include"] as const;
export const ALT_CLAUSES = ['until', 'beginning'] as const;
export const ALL_CLAUSES = [...CLAUSES, ...META_CLAUSES, ...ALT_CLAUSES] as const;

export const RELATIVE = ['next', 'last', 'this', 'today', 'tomorrow', 'yesterday'] as const;

export const INFORMAL_QUANTIFIERS = ['couple', 'few', 'several', 'other', 'back'] as const;
export const UNIT_QUANTIFIERS = ['dozen'] as const;
export const DATE_QUANTIFIERS = ['decade', 'century', 'millenium'] as const;
export const MIDS = ['mid-month', 'mid-day'] as const;
export const ALL_QUANTIFIERS = [...INFORMAL_QUANTIFIERS, ...UNIT_QUANTIFIERS, ...DATE_QUANTIFIERS, ...MIDS] as const;

export const RECURRANCES = [
    'mondays', 'tuesdays', 'wednesdays', 'thursdays', 'fridays', 'saturdays', 'sundays', 'weekdays', 'weekends',

    'hourly', 'daily', 'biweekly', 'weekly', 'semi-monthly', 'bi-monthly',
    'monthly', 'semiannually', 'annually', 'biennially', 'semi-decennially',
    'bi-decennially', 'decennially', 'semi-centennially', 'bi-centennially',
    'centennially', 'millennially',

] as const;

export const MULTI = ['weekday', 'workday', 'weekend'] as const;

export const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const SPECIAL = ['quarter'] as const;
export const ALT_DATE_QUANTIFIERS = ['hour', 'day', 'week', 'month', 'year'] as const;
export const GENERAL = [...DAYS, ...MONTHS, ...SPECIAL, ...ALT_DATE_QUANTIFIERS] as const;

export const SIMPLE_REPLACE = [...ALL_QUANTIFIERS, ...ALT_CLAUSES, ...RECURRANCES, ...MULTI] as const;
const _ALL_KEYWORDS = [...ALL_CLAUSES, ...SIMPLE_REPLACE, ...RELATIVE, ...GENERAL] as const;
export const ALL_KEYWORDS = getUniqueArray<string>([..._ALL_KEYWORDS]);


export const ANY_CLAUSE: string = (() => { let s: string = ''; for (let i of CLAUSES) s += i + '|'; return s.slice(0, -1); })();
export const ANY_META: string = (() => { let s: string = ''; for (let i of META_CLAUSES) s += i + '|'; return s.slice(0, -1); })();
export const ANY_ALL_CLAUSE: string = (() => { let s: string = ''; for (let i of ALL_CLAUSES) s += i + '|'; return s.slice(0, -1); })();
export const ANY: string = (() => { let s: string = ''; for (let i of ALL_KEYWORDS) s += i + '|'; return s.slice(0, -1); })();


export const MATCHERS: Record<typeof SIMPLE_REPLACE[number], [RegExp, string]> = {
    'back': [/ back ?/gim, ' ago '],// chrono doesn't understand "couple years back" but understands "couple years ago"
    'other': [/ other /gim, ' 2 '],// 'every other day' doesn't work but 'every 2 day' does
    'couple': [/ (?:a )?couple /gim, ' 2 '],
    'few': [/ (?:a )?few /gim, ' 3 '],
    'several': [/ several /gim, ' 4 '],
    'dozen': [/ (?:a )?dozen /gim, ' 12 '],
    'decade': [/ ?decade ?/gim, ' 10 years '],
    'century': [/ ?century ?/gim, ' 100 years '],
    'millenium': [/ ?millenium ?/gim, ' 1000 years '],
    'mid-month': [/ ?mid ?-?month ?/gim, ' month on the 15th '],
    'mid-day': [/ ?mid ?-?day ?/gim, ' noon '], // FUTURE: mid/half could be quantifiers, and fractional intervals could be supported

    'mondays': [/ ?mondays ?/gim, ' every monday '],
    'tuesdays': [/ ?tuesdays ?/gim, ' every tuesday '],
    'wednesdays': [/ ?wednesdays ?/gim, ' every wednesday '],
    'thursdays': [/ ?thursdays ?/gim, ' every thursday '],
    'fridays': [/ ?fridays ?/gim, ' every friday '],
    'saturdays': [/ ?saturdays ?/gim, ' every saturday '],
    'sundays': [/ ?sundays ?/gim, ' every sunday '],
    'weekdays': [/ ?weekdays ?/gim, ' every weekday '],
    'weekends': [/ ?weekends ?/gim, ' every weekend '],

    'hourly': [/ ?hourly ?/gim, ' every hour '],
    'daily': [/ ?daily ?/gim, ' every day '],
    'biweekly': [/ ?biweekly ?/gim, ' every 2 weeks '],
    'weekly': [/ ?weekly ?/gim, ' every week '],
    'semi-monthly': [/ ?semi-?monthly ?/gim, ' every month on the 15th '],
    'bi-monthly': [/ ?bi-?monthly ?/gim, ' every 2 months '],
    'monthly': [/ ?monthly ?/gim, ' every month '],
    'semiannually': [/ ?(bi|semi)-?annually ?/gim, ' every 6 months '],
    'annually': [/ ?(yearly|annually) ?/gim, ' every year '],
    'biennially': [/ ?bi-?ennially ?/gim, ' every 2 years '],
    'semi-decennially': [/ ?semi-?decennially ?/gim, ' every 5 years '],
    'bi-decennially': [/ ?bi-?decennially ?/gim, ' every 20 years '],
    'decennially': [/ ?decennially ?/gim, ' every 10 years '],
    'semi-centennially': [/ ?semi-?centennially ?/gim, ' every 50 years '],
    'bi-centennially': [/ ?bi-?centennially ?/gim, ' every 200 years '],
    'centennially': [/ ?centennially ?/gim, ' every 100 years '],
    'millennially': [/ ?millennially ?/gim, ' every 1000 years '],// yes, I like to schedule things 1000 years in advance
    'weekday': [/ ?weekday ?/gim, ' mon,tue,wed,thu,fri '],
    'workday': [/ ?workday ?/gim, ' mon,tue,wed,thu,fri '],
    'weekend': [/ ?weekend ?/gim, ' sat,sun '],
    'beginning': [/ beginning /gim, ' starting '],
    'until': [/ until /gim, ' ending '],
};

export function SanitizeInput(input: string) {
    SIMPLE_REPLACE.forEach((v) => input = input.replace(...MATCHERS[v]));
    return input;
}


const LikelySemanticOrdering = new Map<ReadonlyArray<string>, Array<string>>(
    [
        [META_CLAUSES, [...CLAUSES, ...ALT_CLAUSES, ...RELATIVE, ...RECURRANCES, ...ALL_QUANTIFIERS, ...GENERAL]],
        [CLAUSES, [...RELATIVE, ...MULTI, ...ALL_QUANTIFIERS, ...GENERAL]],
        [ALT_CLAUSES, [...RELATIVE, ...MULTI, ...ALL_QUANTIFIERS, ...GENERAL]],
        [RELATIVE, [...MULTI, ...GENERAL]],
        [MULTI, [...ALL_CLAUSES, ...ALT_CLAUSES]],
        [RECURRANCES, [...ALL_CLAUSES, ...ALT_CLAUSES,]],
        [GENERAL, [...ALL_CLAUSES, ...ALT_CLAUSES,]],
    ]

);
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export function GetLikely(input: string): string[] {
    if (isNullOrWhitespace(input)) return ALL_KEYWORDS;
    for (let [key, val] of LikelySemanticOrdering)
        if (key.includes(input)) return val;
    return ALL_KEYWORDS;
}



export enum E {
    BOTH = 0,
    TYPES = 1,
    CLAUSES = 2,
}

export function GetClauses(input: string, clauseMatcher: string, includeType = E.BOTH): string[] {
    let splitter: string = '(?<!(?:' + clauseMatcher + ') )(' + clauseMatcher + ')'; // splits clauses but ignores double clauses, e.g. 'every starting'
    let res = input.split(new RegExp(splitter, 'ig'));
    res.shift(); // first result after split is always unnecessary
    if (includeType == E.CLAUSES) res = res.filter((_, idx) => { return idx % 2 === 1; }); // odd indices are the clauses
    if (includeType == E.TYPES) res = res.filter((_, idx) => { return idx % 2 === 0; }); // even indices are the types
    // console.log(res);
    return res;
}

class Clause {
    public isRecurrent: boolean;
    public parseResults: chrono.ParsedResult[];
    public parsedDate: Date;

    protected details: any[] = new Array();
    private clause: string;
    private _rruleVersion: string;
    private ass = (e: CustomEvent) => { this.details.push(e.detail); };

    public get rruleVersion(): string { return 'every ' + this._rruleVersion; }

    constructor(recurrent = false) { this.isRecurrent = recurrent; }

    public setClause(value: string): void {
        this.clause = value.trim();

        addEventListener(eHOLIDAY, this.ass);
        this.parseResults = chrono.casual.parse(this.clause); // custom parser fires event that sets holiday detail... smelly
        removeEventListener(eHOLIDAY, this.ass);

        this.parsedDate = this.parseResults[0]?.date() ?? new Date();
        // console.log("setClause: %c" + this.parsedDate, 'color:red');
        this.handleHolidays();

        if (this.clause.match(ANY_CLAUSE)) throw new Error("Clause may not have any subclauses: " + this.clause);
        // console.log(this);
    }

    private handleHolidays() {
        this._rruleVersion = this.clause;
        if (this.details.length) { //entering here means the listener was triggered and we have a holiday
            for (let detail of this.details) {
                let hday = detail.holiday;
                if (this.isRecurrent) {
                    this._rruleVersion = (hday.type == 'rel')
                        ? this._rruleVersion.replace(detail.pattern, hday.rrule)
                        : this._rruleVersion.replace(detail.pattern, DU.monthName(hday.month) + ' on ' + DU.nth(hday.date));
                }
                else {
                    // this is jank, but in order to work on e.g. "last halloween" we need to convert to "last year" with a ref date of this halloween
                    if (this.clause.match(/(this|ago|last|next)/)) {
                        // console.log('Here: ', detail.date, this.parsedDate, this.parseResults[0], this.parseResults[0].start.date());
                        this.parseResults = chrono.casual.parse(this.clause.replace(detail.pattern, 'year'), detail.date);
                        this.parsedDate = this.parseResults[0].date();
                        // console.log('Here: ', detail.date, this.parsedDate, this.parseResults[0]);
                        console.log("handleHolidays: %c" + this.parsedDate, 'color:red');
                    }
                }

            }
            this.details = null;
        }
    }
}

export class MetaClause extends Clause {
    included: boolean;
    isRecurrent: boolean;

    every: Clause;
    starting: Clause;
    ending: Clause;

    constructor(type: string, clause: string) {
        super();
        this.included = type === 'include';
        let types = GetClauses(clause, ANY_CLAUSE, E.TYPES);
        let clauses = GetClauses(clause, ANY_CLAUSE, E.CLAUSES);

        if (hasDuplicates(types)) throw new Error("Cannot have multiple clauses of the same type");

        for (let [T, cz] of zip(types, clauses)) {
            let whichT: Clause;
            T = T.toLowerCase();

            switch (T) {
                case 'every': this.every = new Clause(true); whichT = this.every; break;
                case 'starting': this.starting = new Clause(); whichT = this.starting; break;
                case 'ending': this.ending = new Clause(); whichT = this.ending; break;
            }
            whichT.setClause(cz);
            // if (whichT.parseResults)
        }

        this.isRecurrent = this.every != undefined;
        if (!this.isRecurrent) {
            super.setClause(clause);
            // some things chrono can't handle, like 'march on the 2nd last day'
            if (clause.match(/on/)) // rrule apparantly doesn't error out on 'every this fri' and treats it as 'every day' so this is a bandaid for now
                try {

                    // console.log("HALLO ", this.parsedDate);
                    let count = 0, opt = RRule.parseText(this.rruleVersion);
                    opt.dtstart = this.parsedDate;
                    this.parsedDate = new RRule(opt).all(() => !count++)[0]; // so after chrono does it's part, we treat it like a recurrance and grab the first occurance
                    // console.log("HALLO ", this.parsedDate);
                }
                catch {
                    // for now, we'll just assume that if rrule errors out, then chrono's result was good enough already
                }
        }
        // console.log('EXITING', this);
    }

    public setClause(value: string): void { throw new Error("Called MetaClause.setClause"); } // doing this for now to make sure nothing accidentally does holiday preprocessing

}
