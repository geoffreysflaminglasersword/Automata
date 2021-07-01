import { Dir, Name, Path } from 'common';
import { IVisitee, IVisitor } from "./Visitor";

export class Context implements IVisitee {
    name: string;
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
        super();
        this.match = match, this.destination = destination;
    }
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
        this.contextMap.set(ctx.name, ctx);
    }
}
