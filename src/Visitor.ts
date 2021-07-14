import { FileContext, PropertyContext, Rule, TaskContext } from "./Node";
import { File, Node as GNode, Global, ME } from "common";
import { PropType, getAttrUpdateOrder } from 'Utils';

import Graph from "graphology";

export interface IHasResource { resource?: any; }
export interface IVisitor { visit(visitee: IVisitee): any; }
export interface IVisitee { accept<T extends IVisitor>(visitor: T, ...args: any): ReturnType<T['visit']>; }



export abstract class Visitor<Derived extends Visitor<Derived>> implements IHasResource, IVisitor {
    resource?: any;
    abstract visit(visitee: IVisitee): any;
    constructor(args?: PropType<Derived, 'resource'>) { this.resource = args; }
}

export abstract class NodeVisitor<T extends NodeVisitor<T>> extends Visitor<T> {
    abstract visit(node: GNode): any;
}


export class Equare extends NodeVisitor<Equare> {
    resource: { other: GNode; };
    visit(node: GNode) {
        let { other } = this.resource;
        if (node.constructor != other.constructor) return false;
        if (node instanceof FileContext)
            return node.match.source == (<FileContext>other).match.source;
        else if (node instanceof TaskContext)
            return node.task.id == (<TaskContext>other).task.id;
        else if (node instanceof Rule)
            return node.execute.toString() == (<Rule>other).execute.toString();
        else try { return JSON.stringify(node) === JSON.stringify(other); }
        catch { return false; }
    }
}

export class Activator extends NodeVisitor<Activator> {
    resource: { file?: File; data?: string; };
    visit(node: GNode): boolean {
        let { file, data } = this.resource;
        if (node instanceof FileContext)
            node.isActive = !!('/' + Global.currentFile.path).match(node.match);
        if (node instanceof TaskContext)
            node.isActive = node.task.state == 'done';
        if (node instanceof PropertyContext)
            node.isActive = ME.getYamlProp(node.prop, data) == node.desired;
        if (node instanceof Rule) {
            getAttrUpdateOrder(Global.graph, node.id).forEach(a => a.node.accept(this));
            node.isActive = true;
            for (const [neighbor, attributes] of Global.graph.outNeighborEntries(node.id))
                if (!attributes.node.isActive) { node.isActive = false; break; }
        }
        return node.isActive;
    }
}



