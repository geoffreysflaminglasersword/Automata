import { ContextVisitor } from "./Task";

export class Context {
    name: string;
    accept<T extends ContextVisitor, U extends any[]>(visitor: T, ...args: U): ReturnType<T['visit']> {
        return visitor.visit(this, args);
    };
}
export class FileContext extends Context {
    private _match: string | RegExp;
    public get match(): RegExp {
        if (typeof this._match == 'string')
            return new RegExp('^' + this._match);
        return this._match;
    }
    public set match(value: string | RegExp) {
        this._match = value;
    }
    destination: string;
}
class TimeContext extends Context {
}
class LocationContext extends Context {
}
class ExcludeContext extends Context {
}
export class CompositeContext extends Context {
    contextMap = new Map<string, Context>();
    accept<T extends ContextVisitor, U extends any[]>(visitor: T, ...args: U): ReturnType<T['visit']> {
        for (let [key, val] of this.contextMap)
            val.accept(visitor, args);
        return super.accept(visitor, args);
    };

    addContext(ctx: Context) {
        this.contextMap.set(ctx.name, ctx);
    }
}
