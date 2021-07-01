import { Context, FileContext } from "./Context";
import { File, Global } from "common";

import { PropType } from 'Utils';

interface IHasArgs { args?: any; }
export interface IVisitor { visit(visitee: IVisitee): any; }
export interface IVisitee { accept<T extends IVisitor>(visitor: T, ...args: any): ReturnType<T['visit']>; }



export abstract class Visitor<Derived extends Visitor<Derived>> implements IHasArgs, IVisitor {
    args?: any;
    abstract visit(visitee: IVisitee): any;
    constructor(args?: PropType<Derived, 'args'>) { this.args = args; }

}

export abstract class ContextVisitor<T extends ContextVisitor<T>> extends Visitor<T> {
    abstract visit(context: Context): any;
}

export class ApplicabilityVisitor extends ContextVisitor<ApplicabilityVisitor> {
    visit(context: Context): boolean {
        if (context instanceof FileContext)
            return !!Global.currentFile.path.match(context.match);
        return false;
    }
}

export class CreationVisitor extends ContextVisitor<CreationVisitor> {
    args: { file: File; data: string; };
    visit(context: Context) {
        let { file, data } = this.args;
        if (context instanceof FileContext)
            file.directory = context.destination;
    }
}
