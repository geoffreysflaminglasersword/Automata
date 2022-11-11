import { KEY, ObsidianEvent, Plugin, Scope, KeymapEventListener, Modifier, style } from './common';
import { MONTHS } from './Scheduling/Clause';
import flatpickr from "flatpickr";
import * as RX from 'Regex';
import { Subscriber, Unsubscriber, Updater, Writable } from "svelte/store";
import { BlockCache, CacheItem, Editor, Pos, SectionCache, TFile, Workspace, Loc } from "obsidian";
import { connectedComponents, stronglyConnectedComponents } from "graphology-components";
import { reverse, subgraph } from "graphology-operators";
import { Attributes, NodeKey } from "graphology-types";
import Graph from 'graphology';
import { dijkstra } from "graphology-shortest-path";
import toposort from "toposort";


export const cssBase = 'automata-view';

export function c(className: string) {
    return `${cssBase}__${className} b`;
  }



type SectionType = "list" | "code" | "paragraph" | "heading";

export type Options = flatpickr.Options.Options;
export type Instantce = flatpickr.Instance;

export type PropType<T, P extends keyof T> = T[P];
export type ExtractWritable<T> = T extends Writable<infer U> ? U : never;
export type FilterKeys<T, Extended> = { [K in keyof T]-?: T[K] extends Extended ? K : never }[keyof T];

type FUpdate = { update: (u: Updater<any>) => void; };
export type Invalidator<T> = (value?: T) => void;
type FSubscribe = { subscribe: (u: Subscriber<any>, i?: Invalidator<any>) => Unsubscriber; };

export type UpdatableKeys<T> = FilterKeys<T, FUpdate>;
export type SubscribableKeys<T> = FilterKeys<T, FSubscribe>;

type Able<T> = UpdatableKeys<T> | SubscribableKeys<T>;
export type MemberStoreType<T extends V, U, V extends Able<U> = UpdatableKeys<U>> = ExtractWritable<PropType<U, T>>;

export type WritablePropertize<T> = {
    [Prop in keyof T as `S${Capitalize<string & Prop>}`]: Writable<T[Prop]>;
};



export function nth(n: number) { return String(n) + (['', 'st', 'nd', 'rd'][n / 10 % 10 ^ 1 && n % 10] || 'th'); }
export function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
export function monthName(n: number) {
    return MONTHS[n];
}



export function wrap(num: number, max: number): number {
    return (max + (num % max)) % max;
}
export function hasDuplicates<T>(arr: Array<T>) {
    return new Set(arr).size !== arr.length;
}
export function getUniqueArray<T>(a: Array<T>) {
    return Array.from(new Set(a));
}
export function isNullOrWhitespace(input: string) {

    if (typeof input === 'undefined' || input == null) return true;

    return input.replace(/\s/g, '').length < 1;
}

export type MakeIterable<T> = { [K in keyof T]: Iterable<T[K]> };

export function* zip<T extends Array<any>>(...toZip: MakeIterable<T>): Generator<T> {
    const iterators = toZip.map(i => i[Symbol.iterator]());
    while (true) {
        const results = iterators.map(i => i.next());
        if (results.some(({ done }) => done)) break;
        yield results.map(({ value }) => value) as T;
    }
}






interface KeyEventRegistrant { mods: Modifier[]; key: KEY; func: KeymapEventListener; }
interface EventRegistrant { ev: string; func: any; }

function register(
    scope?: Scope,
    keyEvs?: KeyEventRegistrant[],
    plugin?: Plugin,
    evs?: EventRegistrant[]) {
    let kevs = keyEvs?.map((i) => scope.register(i.mods, i.key, i.func));
    evs?.forEach((v) => plugin.registerCodeMirror((cm) => cm.on(v.ev, v.func)));
    return () => {
        kevs?.forEach((keh) => scope.unregister(keh));
        evs?.forEach((v) => plugin.registerCodeMirror((cm) => cm.off(v.ev, v.func)));
    };
}

export function Register(
    scope?: Scope,
    keyEvs?: (Modifier[] | KEY | KeymapEventListener)[][],
    plugin?: Plugin,
    evs?: (ObsidianEvent | Function)[][]) {
    if ((scope ? !keyEvs : keyEvs) || (plugin ? !evs : evs)) {
        console.log(`scope,keyEvs,plugin,evs`, scope, keyEvs, plugin, evs);
        throw new Error('In Utils::Register: must have either or both of scope and keyEvs, and plugin and evs');
    };
    // console.log("Register: ", scope, plugin);
    return register(
        scope,
        keyEvs?.map((v) => { return { mods: v[0] as Modifier[], key: v[1] as KEY, func: v[2] as KeymapEventListener }; }),
        plugin,
        evs?.map((v) => { return { ev: v[0] as ObsidianEvent, func: v[1] }; })
    );
}

export function fromLoc(input: Loc) {
    return <CodeMirror.Position>{ line: input.line, ch: input.col };
}

export class SectionUtils {
    cm: CodeMirror.Editor;
    sections: SectionCache[];
    constructor(cm: CodeMirror.Editor, sections?: SectionCache[]) {
        this.cm = cm;
        this.sections = sections;
    }

    sectionStart(section: SectionCache) {
        return this.cm.getLine(section.position.start.line);
    }

    getHeadingPos(level: number, section: SectionCache, sections?: SectionCache[]) {
        let using = sections ?? this.sections;
        let res: SectionCache = section;
        for (let sec of using) {
            if (sec.position.start.offset > section.position.start.offset) break;
            else if (sec.type == "heading") {
                if (level) {
                    let currentLevel = this.sectionStart(sec).match(RX.matchHeadingHashes)?.length;
                    if (currentLevel == level) res = sec;
                } else res = sec;
            }
        }

        return { start: fromLoc(res.position.start), end: fromLoc(res.position.end) };
    }

    getSubSectionsEnd(start: SectionCache, sections?: SectionCache[]) {
        let using = sections ?? this.sections;
        let idx = using.indexOf(start) + 2;
        let end = fromLoc(start.position.end);
        for (; idx < using.length; idx++) {
            if (this.isGreaterSection(start, using[idx])) continue;
            if (this.isGreaterSection(using[idx], start)) break;
            console.log(idx, start, using[idx]);
            end = fromLoc(using[idx].position.start);
            break;
        }
        return end;
    }

    getSectionFromPos(position: CodeMirror.Position, sections?: SectionCache[]) {
        let using = sections ?? this.sections;
        for (let sec of using) {
            let { position: pos, type, id } = sec;
            if (pos.start.line <= position.line && pos.end.line >= position.line) return sec;
        }
        throw new Error("in getSectionFromPos: tried to get section at invalid position");
        return null;
    }

    isGreaterSection(left: SectionCache, right: SectionCache) {
        let t1: SectionType = <SectionType>left.type;
        let t2: SectionType = <SectionType>right.type;
        let L1 = this.sectionStart(left).match(RX.matchHeadingHashes)?.length,
            L2 = this.sectionStart(right).match(RX.matchHeadingHashes)?.length;
        switch (t1) {
            case "heading": return t2 == "heading" ? L1 < L2 : true; // lower number of hashes means higher level
            default: return t2 != 'heading'; // for now headings are greater than everything else, and everything else is greater than each other
        }
    }
}

export type Dir = string;
export type Name = string;
export type Path = string;

export class File {
    private _directory: Dir;
    public get directory(): Dir {
        return this._directory;
    }
    public set directory(value: Dir) {
        this._directory = isNullOrWhitespace(value) ? null : value;
    }
    name: Name;
    public get path(): Path {
        return `${this.directory}/${this.name}.md`; //FUTURE:incorporate filetypes if necessary
    }
    public set path(value: Path) {
        this.directory = value.replace(RX.matchFileName, '') ?? '';
        this.name = value.match(RX.matchFileName)?.first().replace(/\.\w+/, '') ?? '';
    }
    constructor(path: Dir | Path, name?: Name) {
        if (name) {
            this.directory = path;
            this.name = name;
        } else this.path = path;
    }
}



export function getUpdateOrder(graph: Graph, nodeKey: string): string[] {
    let component = connectedComponents(graph).find(arr => arr.includes(nodeKey));
    let res = toposort(Array.from(reverse(subgraph(graph, component))).map(x => [x[0], x[1]]));
    res.remove(nodeKey);
    return res;
}

export function getAttrUpdateOrder<T>(graph: Graph<T>, nodeKey: string): T[] {
    return getUpdateOrder(graph, nodeKey).map(key => graph.getNodeAttributes(key));
}



declare global {
    interface Function {
        multi<T extends any[]>(...args: T): void;
        boundMulti<S,T extends any[]>(bound:S, ...args: T): void;
    }
}

/* allows calling a function on each argument (rather than duplicating the function call many times) */
Function.prototype.multi = function <T extends any[]>(...args: T) {
    args.forEach((v) => {
        console.log('%c Here',style,v);
        (<Function>this).call(v)}
        );
};

/* allows calling a function on each argument, while binding the function call to the first argument */
Function.prototype.boundMulti = function <S,T extends any[]>(bound:S, ...args: T) {
    args.forEach((v) => {
        console.log('%c Here',style,this,'\n',bound,'\n',v);
        (<Function>this).bind(bound).call(v)});
};


// log stack trace
export function logStackTrace() {
    var err = new Error();
    console.log(err.stack);
}



// https://blog.logrocket.com/a-practical-guide-to-typescript-decorators/
// "experimentalDecorators": true

// class Rocket {
//     @measure
//     launch() {
//       console.log("Launching in 3... 2... 1... 🚀");
//     }
//   }

// import { performance } from "perf_hooks";

// const measure = (
//   target: Object,
//   propertyKey: string,
//   descriptor: PropertyDescriptor
// ) => {
//   const originalMethod = descriptor.value;

//   descriptor.value = function (...args:any[]) {
//     const start = performance.now();
//     const result = originalMethod.apply(this, args);
//     const finish = performance.now();
//     console.log(`Execution time: ${finish - start} milliseconds`);
//     return result;
//   };

//   return descriptor;
// };