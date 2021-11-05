import { File, Global, ME, TFile } from "common";

import { TaskContext } from "src/Node";
import TimeRule from "Scheduling/Rule";

/* TODO:
    add special task actions:
    - sequential converts all items in a selected list into a bunch of tasks with sequential dependencies
        - need either a setting or multiple hotkeys for how this is handeled
        - top level bullets could depend on each other all the way up, or...
        - lower level bullets could depend on parents
    - unordered does the same but in a random or no order
    - ticklers don't show up in task views, they just open on their own at (or within) the appointed time (range)

    TODO: if parsing a hash in taskLine, check the following word(s) to see if it is a location
  *         the user configured and set the attribute, if not, then set the project attribute
    TODO: also, if that word is followed by a colon, then use it as the attribute and what's after the colon as the value
  *     e.g.
  *         @daily #project #coffee-shop #answer:42 #location:room // note that you can manually set location too. Here, the end result is `location: ['coffee-shop','room']`
  
  * TODO: when detecting 'for [time duration]' set task duration
  * TODO: implement task timers
  * TODO: implement routines
  *     a routine is an ordering of tasks, 
  *     when a timer is started on a routine, it will automatically start the next timer on comletion (and trigger notification sounds ideally)
  *         add option to wait for user confirmation to continue to next task 
  *             e.g. say my current routine task is 'program for 15 minutes remind [[gentle_wave.mp3]]', if I don't hear the gentle wave
  *             at 15 minutes because I'm absorbed in the programming, the routine execution should wait for me to get back to it
*/

export type YAMLProp = 'automata' | `automata.${keyof TaskMembers}`;
interface TaskMembers {
    id: string;
    rule: TimeRule;
    context: string[]; 
    state: string;
    selectedDates?: Date[];
    project?: string;
    location?: string;
}

export class TaskBase {
    rule: TimeRule;
    selectedDates?: Date[];
    getMonthSpan() {
        const all = this.rule.all();
        if (!all?.length) return 0;

        let start = all.first(),
            end = all.last();
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    }
}

/** partial task currently used so that calendar preview can be updated without creating a full task  */
export class PartialTask extends TaskBase {
    enabled = () => Array.from(this.rule.all()).concat(this.selectedDates);
    disabled = () => [].concat(this.rule.exdates(), ...this.rule.exrules().map((v) => Array.from(v.all())));
    constructor(taskLine: string, extra?: Date[]) { super(); this.refresh(taskLine, extra); }
    refresh(taskLine: string, extra?: Date[]) {
        this.selectedDates = extra ?? this.selectedDates;
        if (taskLine != this.rule?.originalString) this.rule = new TimeRule(taskLine);
        extra?.forEach((item) => this.rule.rdate(item));
    }
}



export class Task extends TaskBase implements TaskMembers {
    id: string;
    context: string[];
    state: string;
    project?: string;
    location?: string;
    // block ref
    // isStandarTask
    // state = settings.States...
    file: TFile;
    contents: string;
    async fromFile(file: TFile) {
        this.file = file;
        this.contents = await Global.vault.cachedRead(file);
        let rule = ME.getYamlProp('automata.rule', this.contents)[0];
        this.rule = rule ? new TimeRule(rule) : null;
        this.selectedDates = (ME.getYamlProp('automata.selectedDates', this.contents) as string[])?.map(x => new Date(x));
        this.selectedDates?.forEach(d => this.rule?.rdate(d));
        await this.getProps();
        return this;
    }


    async fromPartial(taskContent: string, titleContent: string, taskLine: string, partial: PartialTask) {
        console.log(titleContent);
        console.log(taskContent);

        partial.refresh(taskLine);
        Object.assign(this, partial);

        this.contents = taskContent;
        let context = new TaskContext(this);
        this.id = context.id;
        this.contents = ME.updateYamlProp('automata.id', this.id, this.contents);
        this.contents = ME.updateYamlProp('automata.rule', this.rule.sanitizedString, this.contents);
        //TODO: if a task is a recurrent task, we need to figure out how to handle state
        // we want every completed task to factor into statistics but we can't really keep track of every past recurrance's state
        // we also can't really have multiple instances of the same task... well we could, but that's more work
        // maybe a simple counter is good enough, along with resetting to 'pending' the day after it's due
        this.contents = ME.updateYamlProp('automata.state', 'pending', this.contents);

        Global.addNode(context);

        //TODO: use default task directory
        this.file = await Global.create(new File('tasks', titleContent), this.contents);
        await this.getProps();
        this.rule.print();

        /* TODO:.75 check settings, determine if we should...
         *             in original file, add link to task using title ... could also avoid having a setting and use a signifier like []@
         *             always focus on title after creation for easy edit
         *             only focus on title if no contexts resolve
         *             don't open file after creation ever 
        */
    }

    async getProps() {
        this.id ??= ME.getYamlProp('automata.id', this.contents)[0]; ;
        this.state = ME.getYamlProp('automata.state', this.contents)[0];
        this.project = ME.getYamlProp('automata.project', this.contents)[0];
        this.location = ME.getYamlProp('automata.location', this.contents)[0];
        this.context = ME.getYamlProp('automata.context', this.contents) as string[];

    }

    //onUpdate
    // if completed and is linked to a Standard Task, complete the standard task
}

