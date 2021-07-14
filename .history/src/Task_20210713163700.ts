import { File, Global, ME, TFile } from "common";

import { TaskContext } from "src/Node";
import TimeRule from "Scheduling/Rule";

/* TODO:
    add special task actions:
    - sequential converts all items in a selected list into a bunch of tasks with sequential dependencies
    - unordered does the same but in a random or no order
    - ticklers don't show up in task views, they just open on their own at (or within) the appointed time (range)

    TODO: if parsing a hash in taskLine, check the following word(s) to see if it is a location
        the user configured and set the attribute, if not, then set the project attribute
    TODO: also, if that word is followed by a colon, then use it as the attribute and what's after the colon as the value
    e.g.
        @daily #project #coffee shop #answer:42 #location:room // could manually set location too
*/

export type YAMLProp = 'chronicler' | `chronicler.${keyof TaskMembers}`;
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
        let rule = ME.getYamlProp('chronicler.rule', this.contents) as string;
        this.rule = rule ? new TimeRule(rule) : null;
        this.selectedDates = (ME.getYamlProp('chronicler.selectedDates', this.contents) as string[])?.map(x => new Date(x));
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
        this.contents = await ME.updateYamlProp('chronicler.id', this.id, this.contents);
        this.contents = await ME.updateYamlProp('chronicler.rule', this.rule.originalString, this.contents);
        this.contents = await ME.updateYamlProp('chronicler.state', 'pending', this.contents);

        Global.addNode(context);

        //TODO: use default task directory
        this.file = await Global.create(new File('tasks', titleContent), this.contents);
        await this.getProps();
        this.rule.print();

        /* TODO: check settings, determine if we should...
            in original file, add link to task using title ... could also avoid having a setting and use a signifier like []@
            always focus on title after creation for easy edit
            only focus on title if no contexts resolve
            don't open file after creation ever 
        */
    }

    async getProps() {
        this.id ??= ME.getYamlProp('chronicler.id', this.contents) as string;
        this.state = ME.getYamlProp('chronicler.state', this.contents) as string;
        this.project = ME.getYamlProp('chronicler.project', this.contents) as string;
        this.location = ME.getYamlProp('chronicler.location', this.contents) as string;
    }

    //onUpdate
    // if completed and is linked to a Standard Task, complete the standard task
}



