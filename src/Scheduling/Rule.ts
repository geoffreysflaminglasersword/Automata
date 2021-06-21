import 'src/Scheduling/refinersAndParsers';

import * as DU from 'src/Utils';
import * as chrono from 'chrono-node';

import { ANY_ALL_CLAUSE, ANY_META, E, GetClauses, MATCHERS, MetaClause, SanitizeInput } from "src/Scheduling/Clause";
import { ChroniclerSettings, get, settings, zip } from '../common';
import { RRule, RRuleSet } from 'rrule';

import { ParsingComponents } from 'chrono-node/dist/results';
import { moment } from 'src/moment_range';

export default class Rule extends RRuleSet {
    clauses: MetaClause[] = [];
    settings: ChroniclerSettings;
    originalString: string;


    constructor(input: string) {
        super(true);
        this.settings = get(settings);
        this.originalString = input;
        settings.subscribe((v) => this.settings = v);
        input = SanitizeRule(input);
        const singleCommaSet = new RegExp(/(?<=^[^,]*)\S+, ?(?:\S+(?:,(?: and)? ?)?)+(?=(?:[^,])*$)/gm);
        const doubleCommaSet = new RegExp(/\S+?, ?(?:\S+(?:,( and)? ?)?)+?(?= \S+?,(?:\S,?)+)/gm);
        const range = new RegExp('\\w*?(?<!' + ANY_ALL_CLAUSE + ') ?(\\w+ - (?:\\w* \\d+\\w+|\\w+ \\d+|\\w+))', 'gim');



        let types = GetClauses(input, ANY_META, E.TYPES);
        let clauses = GetClauses(input, ANY_META, E.CLAUSES);
        // console.log(input, '\n', types, '\n', clauses, '\n');

        let preclauses = new Array<string>();

        for (let [type, clause] of zip(types, clauses)) {
            let match = clause.match(range);

            // I pray no one ever sees this
            if (match) {
                let start = chrono.casual.parse(clause).first().start as ParsingComponents;
                let end = chrono.casual.parse(clause).first().end as ParsingComponents;
                // let r = new RRule()
                let certain = start.getCertainComponents();
                // console.log(certain);
                let r = moment.range(start.date(), end.date());
                // for now we're just going to bother with day ranges
                {// let snap: unitOfTime.Diff =
                    // 	certain.includes('hour')
                    // 		? 'hours'
                    // 		: certain.some((c) => ['day', 'weekday'].includes(c))
                    // 			? 'days'
                    // 			: certain.includes('month')
                    // 				? 'months'
                    // 				: 'years';
                }

                r = r.snapTo('days');
                let a = Array.from(r.by('days'));
                // switch (snap) {
                // 	case 'hours': break;
                // 	case 'days': clause = clause.replace(range, a.map((m) => m.toDate().toLocaleString('en-us', { weekday: 'long' })).join(',')); break;
                // 	case 'months': clause = clause.replace(range, a.map((m) => m.toDate().toLocaleString('en-us', { month: 'long' })).join(',')); break;
                // 	case 'years': clause = clause.replace(range, a.map((m) => m.toDate().toLocaleString('en-us', { year: 'numeric' })).join(',')); break;
                // }

                if (certain.includes('month')) { // did this because the way we do comma delimited sets means you can't have 'include feb 02,feb 03,...'
                    for (let i of a.map((m) => m.toDate())) {
                        if (type == "include") this.rdate(i);
                        else this.exdate(i);
                    }
                    continue;
                }
                else
                    clause = clause.replace(range, a.map((m) => m.toDate().toLocaleString('en-us', { weekday: 'short' })).join(','));
            }
            console.log('Pre-comma replace: ', type, clause);
            match = clause.match(singleCommaSet) ?? clause.match(doubleCommaSet);
            //TODO: add split composit param so that e.g. 'every quarter'=>'every jan,april,july,sept' knows to divide the max event setting by 4
            if (match) { for (let i of match[0].split(',')) if (i !== '') preclauses.push(clause.replace(match[0], i)); }
            else preclauses.push(clause);


            for (let pc of preclauses) {
                // console.log('Post-comma replace, Pre-MClause: ', type, pc);
                let mc = new MetaClause(type, pc);
                this.clauses.push(mc);
                if (mc.isRecurrent) this.createRule(mc);
                else if (mc.included) this.rdate(mc.parsedDate);
                else this.exdate(mc.parsedDate);
            }
            preclauses = [];
        }
    }

    private createRule(mc: MetaClause) {
        console.log("Creating: ", mc.every.rruleVersion);

        let opt = RRule.parseText(mc.every.rruleVersion);
        // let bmda = opt.bymonthday as number[], bmdn = typeof opt.bymonthday === 'number' ? opt.bymonthday : null;
        ;
        let fallback = this.settings?.fallbackLastBound ? this._rrule.last() : null;

        opt.wkst = this.settings.weekStart;
        opt.dtstart = mc.starting?.parsedDate ?? fallback?.options.dtstart ?? mc.every.parsedDate;
        opt.until = mc.ending?.parsedDate ?? fallback?.options.until ?? null;
        opt.count ??= this.settings.defaultMaxEvents;
        // this caused an issue with 'every month on the 1st', and I'm not sure how but the original issue isn't present anymore
        // if (false) bmda[0] = opt.dtstart.getDate(); // added this because rrule erroneously set it to the current month day on 'every 15 months starting jan 1'
        // else if (bmdn) bmdn = opt.dtstart.getDate();

        let rule = new RRule(opt);

        if (mc.included) this.rrule(rule);
        else this.exrule(rule);
    }

    private GetTimeIfNotTimely(rule: RRule, input: string) {
        let opt = RRule.parseText(input);
        rule = new RRule(opt);
        //RRule can't handle time settings in daily/weekly/etc....
        switch (rule.origOptions.freq) {
            case RRule.HOURLY: case RRule.MINUTELY: case RRule.SECONDLY:
                break;
            default:
                // ...so if it's not time based, we will have to remove the time after extracting with chrono
                let t = chrono.casual.parseDate(input);
                input = input.replace(/at .*?(\d\d?(\:\d\d)?((pm)|(am))?) ?/ig, '');
                let opt = RRule.parseText(input);
                opt.dtstart = rule.options.dtstart ?? new Date(Date.now());
                opt.dtstart.setHours(t.getHours());
                opt.dtstart.setMinutes(t.getMinutes());
                opt.dtstart.setSeconds(t.getSeconds());
                rule = new RRule(opt);
            /* this handles cases like "Every month on the 2nd last Friday at around 5am for 7 times"
             by changing it to "Every month on the 2nd last Friday for 7 times"
            */
        }
        return { rule, input };
    }

    // for some reason exdates don't work properly unless they're updated to current time, TODO: will figure out later
    tickleExDates() {
        let x = new Date();
        console.log("tickleDates: %c" + x, 'color:red');

        for (let i of this._exdate) {
            i.setHours(x.getHours(), x.getMinutes(), x.getSeconds());
            i.setFullYear(i.getUTCFullYear(), i.getUTCMonth(), i.getUTCDate());
            console.log("tickleDates: %c" + i.toUTCString() + "   " + i, 'color:yellow');

        }
    }

    all(iterator?: (d: Date, len: number) => boolean): Date[] {
        this.tickleExDates();
        return super.all(iterator);
    }

    between(after: Date, before: Date, inc?: boolean, iterator?: (d: Date, len: number) => boolean): Date[] {
        this.tickleExDates();
        return super.between(after, before, inc, iterator);
    }

    before(dt: Date, inc?: boolean): Date {
        this.tickleExDates();
        return super.before(dt, inc);
    }

    after(dt: Date, inc?: boolean): Date {
        this.tickleExDates();
        return super.after(dt, inc);
    }

    print() {
        console.log("%c" + this.originalString, "color:green");
        console.log("End Result: ", this);
        let count = 0;
        for (let i of this.all()) console.log("%c result: " + i.toUTCString() + "   " + i, "color:orange");
    }

}



// TODO: implement better validation at the clause level, include validation that dates don't use 05-05-2020 (dash notation) 
function SanitizeRule(input: string) {
    //TODO: make sure to use the configured triggerphrase instead of @
    //TODO: make sure that this replaces up to the last @, e.g. '@every day @every week'
    input = input.replace(/.*@ ?(include)?/i, 'include '); // everything before and including '@' isn't important, default to include
    input = input.replace(/((\[\[?)|(\]\]?))/g, ''); // take care of [[wikilinks]] and [brackets]
    input = input.replace(/(\(|\))/g, ''); // take care of (parenthesis)

    input = SanitizeInput(input);

    // IMPORTANT: make sure all other dash replacement happens before these two 
    input = input.replace(/ through /gim, ' - '); // we're using space separated dashes for ranges (it's chrono-required for slash date range parsing)
    input = input.replace(/(?<= ?\w+)(-)(?=\w+ ?)/gim, ' - '); // insert spaces between dashes (mon-fri => mon - fri), this currently voids dash-dates
    input = input.replace(/ but( not)? /gim, ' except ');
    input = input.replace(/ (?:includ(e|ing)|allow(ing)?) /gim, ' include ');
    input = input.replace(/ (?:exclud(e|ing)|disallow(ing)?) /gim, ' except ');
    input = input.replace(/ between (.*?) and /gi, ' starting $1 ending '); // for cases like '@every day between now and next year'


    //quarters are tricky, this is a quick effort to get the basics working
    let monthNum = new Date().getMonth();
    let quarter = Math.floor(monthNum / 3);
    let dist = monthNum - (quarter * 3);
    let nquarters = new RegExp(/(\d+) quarters/);
    let qm = input.match(nquarters);
    if (qm) input = input.replace(nquarters, '' + (Number(qm[1]) * 3) + ' months');
    // for this example: every quarter on the 2nd last day starting last year ending next quarter on the last day
    input = input.replace(/ ?last quarter ?/gim, ' last ' + DU.monthName(DU.wrap(quarter - 1, 4) * 3) + ' '); // last/next quarter needs to be replaced before 'on the...'
    input = input.replace(/ ?next quarter ?/gim, ' next ' + DU.monthName(DU.wrap(quarter + 1, 4) * 3) + ' ');
    input = input.replace(/ ?this quarter ?/gim, ' ' + DU.monthName(quarter * 3) + ' ');
    input = input.replace(/ quarter (?=on the ?\w* first)/gim, ' January,April,July,October ');
    input = input.replace(/ quarter (?=on the ?\w* last)/gim, ' March,June,September,December '); // otherwise the ending clause becomes e.g. 'ending next March,June...'
    input = input.replace(/ quarter ?/gim, ' January,April,July,October on the 1st');

    input = input.replace(/(\d\d\d\d)(?!\w)/gmi, '$1CE'); // default any 4 digit year to CE (not an intelligent way to solve the problem with chrono treating years as times, but in this context it should be fine)
    /* 
    note: right now that example is technically broken, the end date will be the last day of the **first month** of the next quarter
    this isn't something I care to fix, because a different end date like 'next april' works just as well, and the fix
    likely involves a cross product of '[next,this,last] quarter on the  [next,this,last]'
    note: things like 'every 5 quarters' will translate to 'every 15 months', unless the start date is set at the start of a quarter
    this will yield incorrect results. This also isn't something I care to fix at the moment.

    TODO: after all this nastiness, it looks like moment-range might be able to do a better job
    */
    console.log('After sanitization: ', input);

    // TODO: should probably filter out 'the,' i.e. 'quarter on the last day,' doubtful there's edge cases but who knows. See if chrono handels this already
    return input;
}

