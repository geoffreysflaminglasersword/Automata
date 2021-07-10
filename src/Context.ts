import { Dir, ME, Name, Path } from 'common';
import { IVisitee, IVisitor } from "./Visitor";

import { Attributes } from "graphology-types";
import { Global } from "./globalContext";
import { Task } from "Task";
import { YAMLProp } from 'common';

export abstract class Context implements IVisitee, Attributes {
    id: string;
    isActive: boolean;
    constructor(id: string) { this.id = id; }
    accept<T extends IVisitor>(visitor: T): ReturnType<T['visit']> {
        return visitor.visit(this);
    };
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
    destination: Dir;
    constructor(match: string | RegExp, destination: string) {
        super('jeff');
        this.match = match, this.destination = destination;
    }
}

export class PropertyContext extends Context {
    prop: YAMLProp;
}
class TimeContext extends Context {
}
class LocationContext extends Context {
}
class ExcludeContext extends Context {
}
export class CompositeContext extends Context {
    contextMap: Map<string, Context>;
    accept<T extends IVisitor>(visitor: T): ReturnType<T['visit']> {
        for (let [key, val] of this.contextMap) val.accept(visitor);
        return super.accept(visitor);
    };

    addContext(ctx: Context) {
        this.contextMap.set(ctx.id, ctx);
    }
}

export class TaskContext extends Context {
    task: Task;
    constructor(id: string, task: Task) { super(id); this.task = task; }

}