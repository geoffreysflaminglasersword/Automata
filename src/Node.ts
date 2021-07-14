import { File, Task, YAMLProp } from 'common';
import { IVisitee, IVisitor } from "./Visitor";

import { Attributes } from "graphology-types";
import { v4 as uuidv4 } from 'uuid';

//NOTE: contexts should contain information that helps determine whether or not it applies, they should not contain behavior
export abstract class Node implements IVisitee, Attributes {
    id: string = uuidv4();
    isActive: boolean = false;
    constructor(id?: string) { this.id = id ?? this.id; }
    accept<T extends IVisitor>(visitor: T): ReturnType<T['visit']> {
        return visitor.visit(this);
    };
}



export abstract class Context extends Node { }

export class TaskContext extends Context {
    task: Task;
    constructor(task: Task, id?: string) { super(id); this.task = task; }

}
export class PropertyContext extends Context {
    prop: YAMLProp;
    desired: string;
}
class TimeContext extends Context {
}
class LocationContext extends Context {
}
class WorkspaceContext extends Context {
}
class LaneContext extends Context {
}
class ExcludeContext extends Context {
}

export class FileContext extends Context {
    _match: string | RegExp;
    public get match(): RegExp {
        if (typeof this._match == 'string')
            return new RegExp('^' + this._match);
        return this._match;
    }
    public set match(value: string | RegExp) {
        this._match = value;
    }
    constructor(match: string | RegExp) {
        super();
        this.match = match;
    }
}



type EXEC = (file: File, data: string) => void;
export class Rule extends Node {
    execute: EXEC;
    constructor(exec: EXEC) { super(); this.execute = exec; }
}



export class Any extends Node {

}