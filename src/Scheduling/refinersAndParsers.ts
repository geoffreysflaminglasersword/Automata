import * as DU from 'src/Utils';
import * as chrono from 'chrono-node';

import { ParsingComponents, ParsingResult } from 'chrono-node/dist/results';
import { holidayProcess, holidays, regexFromName } from './holidays';

import { ALL_CLAUSES } from 'src/Scheduling/Clause';
import { ParsingContext } from 'chrono-node/dist/chrono';
import UnlikelyFormatFilter from "chrono-node/dist/common/refiners/UnlikelyFormatFilter";

const YMATCH = new RegExp('(?:' + ALL_CLAUSES + ')? *\\d\\d\\d\\d');

class UnlikelyFilterIgnoreBareYear extends UnlikelyFormatFilter {
    constructor(strictMode: boolean = false) {
        super(strictMode);
    }

    isValid(context: any, result: ParsingResult): boolean {
        if (result.text.match(YMATCH))
            return true;
        else return super.isValid(context, result);
    }
}

chrono.casual.refiners = chrono.casual.refiners.map(
    (e) => e instanceof UnlikelyFormatFilter ? new UnlikelyFilterIgnoreBareYear() : e
);


// YEAR PARSING
chrono.casual.parsers.push({
    pattern: () => {
        return YMATCH;
    },
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
        const year = Number(match[0]);
        return new ParsingResult(
            context.refDate,
            match.index,
            match[0],
            new ParsingComponents(context.refDate, { year: year, month: 1, day: 1 }),
        );
    },
});


// HOLIDAY PARSING
holidays.forEach((holiday: any) => {
    chrono.casual.parsers.push({
        pattern: () => {
            return new RegExp(regexFromName(holiday.name), 'i');
        },
        extract: (context: ParsingContext, match: RegExpMatchArray) => {
            const { year, day } = holidayProcess(context, match, holiday);

            return new ParsingResult(
                context.refDate,
                match.index,
                match[0],
                new ParsingComponents(context.refDate,
                    {
                        year: year,
                        month: holiday.month,
                        day: day
                    }
                ),
            );
        },
    });
});

// SOMEDAY
chrono.casual.parsers.push({
    pattern: () => {
        return new RegExp(/someday/i);
    },
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
        let start = new Date(), end = new Date();
        start.setMonth(start.getMonth() + 3);
        end.setMonth(start.getMonth() + 6);
        start = DU.randomDate(start, end); // TODO: incorporate contexts, and urgency/importance into random range
        return new ParsingResult(
            context.refDate,
            match.index,
            match[0],
            new ParsingComponents(context.refDate,
                {
                    year: start.getFullYear(),
                    month: start.getMonth(),
                    day: start.getDate()
                }
            ),
        );
    },
});

// result.end.assign("timezoneOffset",0) // TODO: make refiner that sets all timezones to UTC

chrono.casual.refiners.push({
    refine: (context, results) => {
        results.forEach((result) => {
            if (!result.start.isCertain('meridiem') &&
                result.start.get('hour') >= 1 && result.start.get('hour') < 6) {
                result.start.assign('meridiem', 1);
                result.start.assign('hour', result.start.get('hour') + 12);
            }
        });
        return results;
    }
});
