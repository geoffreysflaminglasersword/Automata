import { Context, FileContext, TaskContext } from "./Context";
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

export class ActivationVisitor extends ContextVisitor<ActivationVisitor> {
    visit(context: Context): boolean {
        if (context instanceof FileContext)
            context.isActive = !!Global.currentFile.path.match(context.match);
        if (context instanceof TaskContext)
            context.isActive = context.task.state == 'done';

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
// class Filter {
//     filters: string[];
//     if = (active: string[]) => this.filters.every(x => active.includes(x)) ? this : null;

// }
// class Transformation extends Filter implements IVisitor {
//     then: Action;
//     args: { file?: File; };
//     visit(context: Context) {
//         let file = this.args.file ?? Global.currentFile;
//         if (context instanceof PropertyContext)
//             ME.updateYamlProp();
//     }
//     prop: Property;
// }