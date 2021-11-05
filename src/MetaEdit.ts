import { Global, RX, TFile, YAMLProp } from "common";

//the following functions are written to allow YAML subproperty updating/retrieval like 'property.subproperty'

export async function updateYamlProps(propNames: YAMLProp[], propValues: (string | any[]), source?: TFile) {
    propNames.forEach((p, i) => asyncUpdateYamlProp(p, propValues[i], source));
}


export function updateYamlProp(propName: YAMLProp, propValue: string | any[], source: string,replace=false) {
    let [property, child] = propName.split('.');

    let existingYAML:string[] = [];
    if(!replace) existingYAML = getYamlProp(propName, source);

    propValue = typeof propValue == 'string' ? [propValue] : propValue;
    propValue = [...new Set(propValue.concat(existingYAML))]; // make sure items values are unique by making a set

    let val = `[${propValue.join(', ')}]`;
    let newContents = child ? RX.replaceYamlSubproperty(source, property, child, val) : RX.replaceYamlProp(source, property, val);
    let parentUpdated = (!newContents && child) ? RX.nullReplace(source, RX.getYamlProp(property), `$1\n  - ${child}: ${val}$3`) : null;
    let createdParent = parentUpdated ? null : source.replace(RX.matchYamlEnd, `$1${property}:${child ? `\n  - ${child}:` : ''} ${val}\n$2`);

    newContents ??= RX.hasYaml(source) ? parentUpdated ? parentUpdated : createdParent
        : `---\n${property}:${child ? `\n  - ${child}:` : ''} ${val}\n---\n`.concat(source); // create new yaml section, optionally with child
    return newContents;
}

export function getYamlProp(propName: YAMLProp, source: string) : string[]{
    let [prop, child] = propName.split('.');
    let match = child ? source.match(RX.getYamlSub(prop, child)) : source.match(RX.getYamlProp(prop));
    let val = match ? match[2] : null;
    if(!val) return [];
    return val.match(/\[/) ? val.replace('[', '').replace(']', '').split(', ') : [val];
}


export async function asyncUpdateYamlProp(propName: YAMLProp, propValue: string | any[], source?: TFile) {
    source ??= Global.currentFile;
    let contents = await Global.vault.cachedRead(source);
    contents = updateYamlProp(propName, propValue, contents);
    await Global.vault.modify(source, contents);
    return contents;
}

export async function asyncGetYamlProp(propName: YAMLProp, source?: TFile) {
    source ??= Global.currentFile;
    let contents: string;
    contents = await Global.vault.cachedRead(source);
    return getYamlProp(propName, contents);
}


export function getFilesWithProperty(propName: YAMLProp): TFile[] {
    const markdownFiles = Global.vault.getMarkdownFiles();

    let files: TFile[] = [];
    let [prop, child] = propName.split('.');

    markdownFiles.forEach(file => {
        const fileCache = Global.app.metadataCache.getFileCache(file);
        const fileFrontmatter = fileCache?.frontmatter;
        if (fileFrontmatter && fileFrontmatter[prop])
            if (!child || (fileFrontmatter[prop] as any[])?.find(x => child in x)) files.push(file);
    });

    return files;
}
