// import type { IMetaEditApi } from "./IMetaEditApi";
// import MetaController from "./metaController";
// import type MetaEdit from "./main";
// import type { Property } from "./parser";

import { Global, RX, YAMLProp } from "common";
import { Notice, TFile } from "obsidian";

import { isNullOrWhitespace } from "Utils";
import { parseYaml } from "obsidian";



export async function updateYamlProp(propName: YAMLProp, propValue: string | any[], file?: TFile | string) {
    file ??= Global.currentFile;
    let contents: string;
    if (file instanceof TFile) contents = await Global.vault.cachedRead(file);
    else contents = file;
    let [prop, child] = propName.split('.');
    let val = typeof propValue == 'string' ? propValue : `[${propValue.join(', ')}]`;
    let newContents = child ? RX.replaceYamlSub(contents, prop, child, val) : RX.replaceYamlProp(contents, prop, val);
    let parentUpdated = (!newContents && child) ? RX.nullReplace(contents, RX.getYamlProp(prop), `$1\n  - ${child}: ${val}$3`) : null;
    let parentCreated = parentUpdated ? null : contents.replace(RX.matchYamlEnd, `$1${prop}:${child ? `\n  - ${child}:` : ''} ${val}\n$2`);

    newContents ??= RX.hasYaml(contents) ? parentUpdated ? parentUpdated : parentCreated
        : `---\n${prop}:${child ? `\n  - ${child}:` : ''} ${val}\n---`.concat(contents); // create new yaml section, optionally with child

    await Global.vault.modify(<TFile>file, newContents);
}

export async function getYamlProp(propName: YAMLProp, file?: TFile | string) {
    file ??= Global.currentFile;
    let contents: string;
    if (file instanceof TFile) contents = await Global.vault.cachedRead(file);
    else contents = file;
    let [prop, child] = propName.split('.');
    let match = child ? contents.match(RX.getYamlSub(prop, child)) : contents.match(RX.getYamlProp(prop));
    let val = match ? match[2] : null;
    return val?.contains('[') ? val.replace('[', '').replace(']', '').split(', ') : val;
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


// NOTE: got the following from metaedit plugin, decided to do things differently, keeping temporarily for reference

// enum MetaType {
//     YAML, Dataview, Tag, Option
// }
// export type Property = { key: string, content: any, type: MetaType; };

// enum EditMode {
//     AllSingle = "All Single",
//     AllMulti = "All Multi",
//     SomeMulti = "Some Multi",
// }


// /* export */ async function createYamlProperty(propertyName: string, propertyValue: string, file?: TFile | string) {
//     file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

//     await addYamlProp(propertyName, propertyValue, file);
// }



// /* export */ async function updateProperty(propertyName: string, propertyValue: string, file?: TFile | string) {
//     file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

//     const propsInFile: Property[] = await getPropertiesInFile(file);

//     const targetProperty = propsInFile.find(prop => prop.key === propertyName);
//     if (!targetProperty) return;

//     return updatePropertyInFile(targetProperty, propertyValue, file);
// }

// /* export */ async function getPropertyValue(propertyName: string, file?: TFile | string) {
//     file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

//     const propsInFile: Property[] = await getPropertiesInFile(file);

//     const targetProperty = propsInFile.find(prop => prop.key === propertyName);

//     let find = (key: string) => propsInFile.find(
//         prop => {
//             return prop.key === propertyName;
//         }
//     );
//     if (!targetProperty) return;

//     return targetProperty.content;
// }



// export async function getPropertiesInFile(file?: TFile | string): Promise<Property[]> {
//     file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

//     const yaml = await parseFrontmatter(file);
//     const inlineFields = await parseInlineFields(file);
//     const tags = await getTagsForFile(file);
//     let res = new Set<Property>([...tags, ...inlineFields]);

//     return [...tags, ...yaml, ...inlineFields];
// }











// function getFileFromTFileOrPath(file?: TFile | string) {
//     let targetFile: TFile;

//     if (file instanceof TFile)
//         targetFile = file;

//     if (typeof file === "string") {
//         const abstractFile = Global.vault.getAbstractFileByPath(file);
//         if (abstractFile instanceof TFile) {
//             targetFile = abstractFile;
//         }
//     }

//     return targetFile;
// }




// async function addYamlProp(propName: string, propValue: string, file: TFile, useArray = false): Promise<void> {
//     const fileContent: string = await Global.vault.read(file);
//     const frontmatter: Property[] = await parseFrontmatter(file);
//     const isYamlEmpty: boolean = !frontmatter || frontmatter.length === 0;

//     console.log(`frontmatter`, frontmatter, isYamlEmpty);

//     if (useArray) {
//         propValue = `[${propValue}]`;
//     }

//     let splitContent = fileContent.split("\n");
//     if (isYamlEmpty) {
//         splitContent.unshift("---");
//         splitContent.unshift(`${propName}: ${propValue}`);
//         splitContent.unshift("---");
//     }
//     else {
//         splitContent.splice(1, 0, `${propName}: ${propValue}`);
//     }

//     const newFileContent = splitContent.join("\n");
//     await Global.vault.modify(file, newFileContent);
// }

// async function updatePropertyInFile(property: Partial<Property>, newValue: string, file: TFile): Promise<void> {
//     const fileContent = await Global.vault.read(file);

//     const newFileContent = fileContent.split("\n").map(line => {
//         if (lineMatch(property, line)) {
//             return updatePropertyLine(property, newValue);
//         }

//         return line;
//     }).join("\n");

//     await Global.vault.modify(file, newFileContent);
// }

// function lineMatch(property: Partial<Property>, line: string): boolean {
//     const propertyRegex = new RegExp(`^\s*${property.key}\:{1,2}`);
//     const tagRegex = new RegExp(`^\s*${property.key}`);

//     if (property.key.contains('#')) {
//         return tagRegex.test(line);
//     }

//     return propertyRegex.test(line);
// }


// function updatePropertyLine(property: Partial<Property>, newValue: string) {
//     let newLine: string;
//     switch (property.type) {
//         case MetaType.Dataview:
//             newLine = `${property.key}:: ${newValue}`;
//             break;
//         case MetaType.YAML:
//             newLine = `${property.key}: ${newValue}`;
//             break;
//         case MetaType.Tag:
//             const splitTag: string[] = property.key.split("/");
//             if (splitTag.length === 1)
//                 newLine = `${splitTag.first()}/${newValue}`;
//             else if (splitTag.length > 1) {
//                 const allButLast: string = splitTag.slice(0, splitTag.length - 1).join("/");
//                 newLine = `${allButLast}/${newValue}`;
//             } else
//                 newLine = property.key;

//             break;
//         default:
//             newLine = property.key;
//             break;
//     }

//     return newLine;
// }

// async function getTagsForFile(file: TFile): Promise<Property[]> {
//     const cache = Global.app.metadataCache.getFileCache(file);
//     if (!cache) return [];
//     const tags = cache.tags;
//     if (!tags) return [];

//     let mTags: Property[] = [];
//     tags.forEach(tag => mTags.push({ key: tag.tag, content: tag.tag, type: MetaType.Tag }));
//     return mTags;
// }



// async function parseFrontmatter(file: TFile): Promise<Property[]> {
//     const frontmatter = Global.app.metadataCache.getFileCache(file)?.frontmatter;
//     if (!frontmatter) return [];
//     const { position: { start, end } } = frontmatter;
//     const filecontent = await Global.vault.cachedRead(file);

//     const yamlContent: string = filecontent.split("\n").slice(start.line, end.line).join("\n");
//     const parsedYaml = parseYaml(yamlContent);

//     let metaYaml: Property[] = [];


//     let addSub = (key: string, sub: any) => {
//         if (typeof sub === 'object' && !Array.isArray(sub))
//             for (const i in sub)
//                 metaYaml.push({ key: `${key}.${i}`, content: sub, type: MetaType.YAML });
//     };


//     for (const key in parsedYaml) {
//         if (Array.isArray(parsedYaml[key]))
//             for (let i in parsedYaml[key])
//                 addSub(key, parsedYaml[key][i]);
//         metaYaml.push({ key, content: parsedYaml[key], type: MetaType.YAML });
//     }

//     return metaYaml;
// }

// async function parseInlineFields(file: TFile): Promise<Property[]> {
//     const content = await Global.vault.cachedRead(file);

//     return content.split("\n").reduce((obj: Property[], str: string) => {
//         let parts = str.split("::");

//         if (parts.first() && parts[1]) {
//             obj.push({ key: parts.first(), content: parts[1].trim(), type: MetaType.Dataview });
//         }
//         else if (str.includes("::")) {
//             const key: string = str.replace("::", '');
//             obj.push({ key, content: "", type: MetaType.Dataview });
//         }

//         return obj;
//     }, []);
// }
