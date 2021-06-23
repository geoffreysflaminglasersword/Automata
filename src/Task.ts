import { If } from "./common";

export { };


//Global context determines what contexts are assigned to new tasks
//when viewing/filtering tasks, they will only be visible when all their contexts are satisfied

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
class Context {
    accept<T>(visitor: ContextVisitor): ReturnType<typeof visitor.visit> { return visitor.visit(this); };
}
class FileContext extends Context {
    isFolder = false;
    match: string | RegExp;
    constructor(m: string | RegExp) { super(); this.match = m; }
}
class TimeContext extends Context {

}
class LocationContext extends Context {

}
class ExcludeContext extends Context {

}
class CompositeContext extends Context {
    components: Context[];
    accept(visitor: ContextVisitor): ReturnType<typeof visitor.visit> {
        for (let i of this.components) i.accept(visitor);
        return super.accept(visitor);
    };

}

class GlobalContext extends CompositeContext {
    currentDirectory: string;
    contextMap: Map<string, Context>;

    getApplicableContexts(names: string[]) {
        return names.filter(n => this.contextMap.get(n).accept(new ContextValidator()));
    }

    //get contexts that apply

}

/* Rules are used by Global Context to determine what contexts to assign */
class Rule {
    // contexts
}

// TODO: add visit functions for all context types using template literals
interface ContextVisitor {
    visit<T>(context: Context): T;
}

type VRet = boolean;
class ContextValidator implements ContextVisitor {
    visit(context: FileContext): VRet;
    visit(context: TimeContext): VRet;
    visit(context: Context): VRet {
        If(context)
            ?.Is(FileContext).then(ctx => console.log('yo'))
            ?.Is(TimeContext).then(ctx => console.log('yo'));
        console.log('V2');
        return false;
    }
}



class Task {
    // Rule
    // block ref
    // isStandarTask
    // state = settings.States...
    // automatic contexts
    // user contexts


    constructor(blockRef?: any) {
        let context: GlobalContext;
        // set blockRef

        //create directory if not exists

        //determine what title to use
        // check settings
        // use block as title

        // in original file
        // check settings, add link to task using title

        //create task file
        // add embedded link to blockRef


        //  check settings
        // always focus on title after creation for easy edit
        // only focus on title if no contexts resolve
        // don't open file after createion ever

    }

    //onUpdate
    // if completed and isStandardTask complete standard task

}

/**things that a context could resolve:
    file name
    file directory
    project tag
    date

*/