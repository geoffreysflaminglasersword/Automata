
export const working: string[] = [
    "@Every Halloween Ending july 4th 2054 Starting around 5 [[halloweens]] back (at about 5pm) except every other Halloween",
    '@every Halloween,Christmas,mothers-day starting 2 Halloweens ago ending next easter ',
    '@Easter 2028', // <<< vvv these two should be different "calculated" days 
    '@Easter 2029',
    '@every Halloween,Christmas,mothers-day starting 2 Halloweens ago ending easter 2022',
    '@every 13,7 sat ending 2024AD', // for now, if the year is the only thing in the clause it has to be qualified with BC/AD/BCE/CE
    '@every 1,3 sat,mon',
    '@every month on 2nd,3rd sat ending 2022CE', //TODO:.5 replace 4 digit numbers not followed by a suffix with CE
    '@every thur,sat',
    '@every mon,wed,sat',
    '@every 2 mon,wed,sat',
    '@in 3 weeks',
    '@Every week on mon, Wednesday',
    '@Every week on Monday, Tuesday, and Wednesday',
    '@every 3 weeks',
    '@every other thur,sat',
    '@every other tue starting [last month] except [[last tue]] at 3pm',
    '@every day between now and next thursday',
    '@every 5,3 wed,fri beginning yesterday until next october excluding next wed,fri',
    '@every nov,feb on the last fri',
    '@someday', // each someday should be different 
    '@someday',
    '@every monday for 7 times',
    '@every monday include next tuesday',
    '@every monday including next tuesday',
    '@every wed beginning yesterday until next october',
    '@every 3,5 wed,fri beginning yesterday until next october',
    "every starting ending except testing @Every mothers day until 2050AD beginning about 20 years back except every other mothers day starting next year until 2030AD",
    '@every quarter',
    '@this quarter',
    '@this quarter on the 2nd last day', // this currently "works" but it's the 2nd last day of the first month of the quarter
    '@last quarter',
    '@next quarter',
    '@every 3 quarters',
    '@every 5 quarters starting last quarter',
    '@every quarter on the last sat',
    '@mon-fri',
    '@next mon-fri',
    '@fri-mon',
    '@oct 3-5',
    // this technically works, but it's better to use starting/ending for performance
    '@feb 5 - april 4', // we don't convert between the two because of cases like 'every mon-friday starting...' where that would introduce duplicates
    '@monday through friday',
    '@every mon-fri',
    '@2020/05/05-2020/05/08',
    '@2020/05/05 - 2020/05/08',
    '@next thur',
    '@this fri',
    '@last sat',
    '@daily',
    // TODO: rrule currently parses times as integers in 24 hour format only when using daily, so 'every day at 5pm' is actually 'every day at 5' (am)
    // this means time in 'every week on sat at 5pm' isn't  parsed by rrule, but chrono, and is correct, while in order to get 5pm in a daily rule
    // you'd need 'every day at 17'
    '@daily at 5pm', // currently this breaks the default limit (it's converted to  'every day at 5pm for n times', 'at 5pm' stops rrule parsing)
    '@mid day',
    '@weekly',
    '@weekly on sat',
    '@weekly on sat at 5pm',
    '@biweekly',
    '@biweekly on sat',
    '@monthly',
    '@every 5 quarters starting jan 1',
    '@monthly on the 1st',
    '@bimonthly',
    '@mid month',
    '@yearly',
    '@annually',
    '@biannually',
    '@semiannually',
    '@biennially',
    '@semidecennially',
    '@bidecennially',
    '@decennially',
    '@semicentennially',
    '@bicentennially',
    '@centennially',
    '@millennially',
    '@next decade',
    '@last century',
    '@this millenium',
    '@every workday',
    '@every workday starting last tue',
    '@every weekday',
    '@every weekend',
    '@every few days',
    '@every several months',
    '@every couple halloweens',
    "@Every mothers day at around 5am for 7 times", // relative holiday should be different date every year
    "@Every christmas eve at around 5am for 7 times", // absolute should be same
    "@Every Halloween ending july 4th 2054 starting around 5 [[Halloweens]] back (at about 5pm) except Halloween 2019 ",
    "@Every Halloween ending july 4th 2054 starting around 5 [[Halloweens]] back (at about 5pm) except every Halloween starting next year ",
];


export const shouldWork: string[] = [
    ...working,
    "every starting ending except testing @Every Halloween at 7am ending july 4th starting around 2 [[Halloweens]] back (at about 5pm) except next Halloween",

    '@in the morning',
    '@in the afternoon',
    '@this evening',
    '@tonight', // TODO: tonight, tomorrow, morning, afternoon, etc, should be configurable
    '@last night',
    '@in 2 hours',
    '@5', // assume this is time
    '@5pm',
    '@5:00',
    '@5:00am',
    '@at 5p',
    '@from 3-5',
    '@tomorrow at noon',
    '@next hour',
    '@in an hour',
    'I have an appointment @tomorrow from 10 to 11 AM',
    '@every day from 3-5',
    '@every day at 5pm,7pm,9pm',
    '@every 45 minutes from 6a to 7p except wed-sun',
    '@from 3a to 5p',
    '@at 5p for 3 times',
    '@every day through the tenth', // if today is the fifteenth, this should go through next month
    '@every 10 min',
    '@every 85 min',
    '@every 10min',
    '@every 6 hours and 10 minutes from 6a to 7:30p',
    '@every 6hr and 10m from 6a to 7:30p',
    '@every day at 2pm',


    // new
    '@annually starting next thursday ending 2024',
    '@-2hr5min',
    '@two weeks from tomorrow',
    '@2 days before yesterday',
    '@3 days ago',
    '@every 5 minutes from 6a-11a between last monday and next mother\'s day',
    '@every fri,sat between next may 5th and next sept 9th',
    '@every fri,sat between next may 5th and next sept 9th except last thursday and this fri include every day between tomorrow and next christmas include every mon and wed',

    //currently low priority
    '@2 months, 5 days',
    '@+2 months, 5 days',
    '@tomorrow at 5 and 15 minutes earlier and 15 minutes later',
    '@next dec',
    '@this nov',
    '@last may',
    '@next month',
    '@next year',
    '@oct-nov',
    '@every may-july',
    '@on the 7th',
    '@1,3', // assume this is time
    '@7th', // assume this is day of month
    '@every 1,3', // assume this is time
    '@every 1st,3rd', // assume this is day of month
    '@every Halloween, Christmas, and Easter',
    '@every 3 weeks and 2 days', // easy enough to do 23 days, something more involved like 'every 2 years, 4 months, and 6 days' seems rarely useful if ever
];

export const shouldError = [
    '@every last sat',
    '@every day starting tomorrow ending yesterday',
    '@every day starting tomorrow starting tomorrow',
    '@every monday every 5 minutes from 6a to 7p', // has two every clauses
    '@every 1,3 wed,fri beginning yesterday until wed,fri',
    '@every other tue except [[last tue]] at 3pm starting [last year]', // starting must follow an every
    "every starting ending except testing @Every Halloween at 7am ending july 4th starting ending around 2 [[Halloweens]] back (at about 5pm) except next Halloween",
    "every starting ending except testing @Every Halloween at 7am ending starting july 4th starting around 2 [[Halloweens]] back (at about 5pm) except next Halloween",
    "every starting ending except testing @Every Halloween at 7am ending july 4th starting around 2 [[Halloweens]] back (at about 5pm) except every every next Halloween",
    "every starting ending except testing @Every Halloween at 7am ending july 4th starting around 2 [[Halloweens]] back (at about 5pm) except every next Halloween",
    "@every fri,sat between next may 5th and next sept 9th except last thursday include every day between tomorrow and yesterday",
];