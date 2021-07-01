import { File, Global } from "common";

import TimeRule from "Scheduling/Rule";

/* TODO:
    add special task types:
    - sequential converts a list into a bunch of tasks with sequential dependencies
    - unordered does the same but in a random or no order
    - ticklers don't show up in task views, they just open on their own at (or within) the appointed time (range)

    TODO: if parsing a hash in taskLine, check the following word to see if it is a location
        the user configured and set the attribute, if not, then set the project attribute
    TODO: also, if that word it followed by a colon, then use it as the attribute and what's after the colon as the value
*/
/* things that a context could resolve:
 file name
 file directory
 project tag
 date
 
 */
/*

    if I'm in file X then write to directory Y
    if I'm in file X then assign project #Project
    if I'm in file X and the current time is between 5 and 9, then assign due date of tomorrow

    if I'm on board B, task A should show up if task Z is complete or today is after day D

    if I'm on board B, and I set the manual context to 'in my room,' I see only tasks with the location
        attribute set to room

    As a user, I would need to create a context 'in file X'
        I would need to create a context of 'time between 5 and 9'
        I would need to create a rule with a composite context for the 'if' and an action for the 'then'


    we need rules at the board level and global level
    we need contexts at the task level and global level

    board rules are for filtering
    global rules are for determining which actions to perform

    'then' actions are mostly for setting metadata, could also execute template
    Actions:
        assign context
        set metadate
            set date rule
            set user specified
        run template
*/
/*
    file/folder context : user or automatic
        allow basic matching and regex matching
    time context : user or automatic
        use date Rule
        e.g., on mondays after 5 the context applies
    location context : user context
    exclusion context : user
        example:
            when in file X don't allow context Y
    Composit context
        combine several contexts
 */
// /* Rules are used by Global Context to determine what contexts to assign */
// class Rule {
//     // contexts
// }

export class TaskBase {
    rule: TimeRule;
    extra?: Date[];
    getMonthSpan() {
        const all = this.rule.all();
        if (!all?.length) return 0;

        let start = all.first(),
            end = all.last();
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    }
}

export class PartialTask extends TaskBase {

    constructor(taskLine: string, extra?: Date[]) {
        super();
        this.refresh(taskLine, extra);
    }

    refresh(taskLine: string, extra?: Date[]) {
        this.extra = extra ?? this.extra;
        if (taskLine != this.rule?.originalString) this.rule = new TimeRule(taskLine);
        extra?.forEach((item) => this.rule.rdate(item));
        // this.rule.print();
    }

    enabled = () => Array.from(this.rule.all()).concat(this.extra);
    disabled = () => [].concat(this.rule.exdates(), ...this.rule.exrules().map((v) => Array.from(v.all())));
}
export class Task extends TaskBase {
    // Rule
    // block ref
    // isStandarTask
    // state = settings.States...
    // automatic contexts
    // user contexts

    constructor(taskContent: string, titleContent: string, taskLine: string, partial: PartialTask) {
        super();
        partial.refresh(taskLine);
        Object.assign(this, partial);

        console.log(titleContent);
        console.log(taskContent);

        Global.create(new File('tasks', titleContent), taskContent);

        // in original file
        // check settings, add link to task using title

        //  check settings
        // always focus on title after creation for easy edit
        // only focus on title if no contexts resolve
        // don't open file after createion ever
    }

    //onUpdate
    // if completed and isStandardTask complete standard task
}



