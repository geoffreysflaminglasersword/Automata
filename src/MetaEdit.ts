// import type { IMetaEditApi } from "./IMetaEditApi";
// import MetaController from "./metaController";
// import type MetaEdit from "./main";
// import type { Property } from "./parser";

import { Notice, TFile } from "obsidian";

import { Global } from "common";
import { parseYaml } from "obsidian";

enum MetaType {
    YAML, Dataview, Tag, Option
}
type Property = { key: string, content: any, type: MetaType; };

enum EditMode {
    AllSingle = "All Single",
    AllMulti = "All Multi",
    SomeMulti = "Some Multi",
}

export async function createYamlProperty(propertyName: string, propertyValue: string, file?: TFile | string) {
    file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

    await addYamlProp(propertyName, propertyValue, file);
}

export async function updateProperty(propertyName: string, propertyValue: string, file?: TFile | string) {
    file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

    const propsInFile: Property[] = await getPropertiesInFile(file);

    const targetProperty = propsInFile.find(prop => prop.key === propertyName);
    if (!targetProperty) return;

    return updatePropertyInFile(targetProperty, propertyValue, file);
}

export async function getPropertyValue(propertyName: string, file?: TFile | string) {
    file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

    const propsInFile: Property[] = await getPropertiesInFile(file);

    const targetProperty = propsInFile.find(prop => prop.key === propertyName);
    if (!targetProperty) return;

    return targetProperty.content;
}

export function getFilesWithProperty(property: string): TFile[] {
    const markdownFiles = Global.vault.getMarkdownFiles();
    let files: TFile[] = [];

    markdownFiles.forEach(file => {
        const fileCache = Global.app.metadataCache.getFileCache(file);

        if (fileCache) {
            const fileFrontmatter = fileCache.frontmatter;

            if (fileFrontmatter && fileFrontmatter[property]) {
                files.push(file);
            }
        }
    });

    return files;
}

export async function getPropertiesInFile(file?: TFile | string): Promise<Property[]> {
    file = file ? getFileFromTFileOrPath(file) : Global.currentFile;

    const yaml = await parseFrontmatter(file);
    const inlineFields = await parseInlineFields(file);
    const tags = await getTagsForFile(file);

    return [...tags, ...yaml, ...inlineFields];
}











function getFileFromTFileOrPath(file?: TFile | string) {
    let targetFile: TFile;

    if (file instanceof TFile)
        targetFile = file;

    if (typeof file === "string") {
        const abstractFile = Global.vault.getAbstractFileByPath(file);
        if (abstractFile instanceof TFile) {
            targetFile = abstractFile;
        }
    }

    return targetFile;
}


async function addYamlProp(propName: string, propValue: string, file: TFile, useArray = false): Promise<void> {
    const fileContent: string = await Global.vault.read(file);
    const frontmatter: Property[] = await parseFrontmatter(file);
    const isYamlEmpty: boolean = !frontmatter || frontmatter.length === 0;

    console.log(`frontmatter`, frontmatter, isYamlEmpty);

    if (frontmatter.some(value => value.key === propName)) {
        new Notice(`Frontmatter in file '${file.name}' already has property '${propName}. Will not add.'`);
        return;
    }

    if (useArray) {
        propValue = `[${propValue}]`;
    }

    let splitContent = fileContent.split("\n");
    if (isYamlEmpty) {
        splitContent.unshift("---");
        splitContent.unshift(`${propName}: ${propValue}`);
        splitContent.unshift("---");
    }
    else {
        splitContent.splice(1, 0, `${propName}: ${propValue}`);
    }

    const newFileContent = splitContent.join("\n");
    await Global.vault.modify(file, newFileContent);
}

async function updatePropertyInFile(property: Partial<Property>, newValue: string, file: TFile): Promise<void> {
    const fileContent = await Global.vault.read(file);

    const newFileContent = fileContent.split("\n").map(line => {
        if (lineMatch(property, line)) {
            return updatePropertyLine(property, newValue);
        }

        return line;
    }).join("\n");

    await Global.vault.modify(file, newFileContent);
}

function lineMatch(property: Partial<Property>, line: string): boolean {
    const propertyRegex = new RegExp(`^\s*${property.key}\:{1,2}`);
    const tagRegex = new RegExp(`^\s*${property.key}`);

    if (property.key.contains('#')) {
        return tagRegex.test(line);
    }

    return propertyRegex.test(line);
}


function updatePropertyLine(property: Partial<Property>, newValue: string) {
    let newLine: string;
    switch (property.type) {
        case MetaType.Dataview:
            newLine = `${property.key}:: ${newValue}`;
            break;
        case MetaType.YAML:
            newLine = `${property.key}: ${newValue}`;
            break;
        case MetaType.Tag:
            const splitTag: string[] = property.key.split("/");
            if (splitTag.length === 1)
                newLine = `${splitTag.first()}/${newValue}`;
            else if (splitTag.length > 1) {
                const allButLast: string = splitTag.slice(0, splitTag.length - 1).join("/");
                newLine = `${allButLast}/${newValue}`;
            } else
                newLine = property.key;

            break;
        default:
            newLine = property.key;
            break;
    }

    return newLine;
}

async function getTagsForFile(file: TFile): Promise<Property[]> {
    const cache = Global.app.metadataCache.getFileCache(file);
    if (!cache) return [];
    const tags = cache.tags;
    if (!tags) return [];

    let mTags: Property[] = [];
    tags.forEach(tag => mTags.push({ key: tag.tag, content: tag.tag, type: MetaType.Tag }));
    return mTags;
}

async function parseFrontmatter(file: TFile): Promise<Property[]> {
    const frontmatter = Global.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter) return [];
    const { position: { start, end } } = frontmatter;
    const filecontent = await Global.vault.cachedRead(file);

    const yamlContent: string = filecontent.split("\n").slice(start.line, end.line).join("\n");
    const parsedYaml = parseYaml(yamlContent);

    let metaYaml: Property[] = [];

    for (const key in parsedYaml) {
        metaYaml.push({ key, content: parsedYaml[key], type: MetaType.YAML });
    }

    return metaYaml;
}

async function parseInlineFields(file: TFile): Promise<Property[]> {
    const content = await Global.vault.cachedRead(file);

    return content.split("\n").reduce((obj: Property[], str: string) => {
        let parts = str.split("::");

        if (parts.first() && parts[1]) {
            obj.push({ key: parts.first(), content: parts[1].trim(), type: MetaType.Dataview });
        }
        else if (str.includes("::")) {
            const key: string = str.replace("::", '');
            obj.push({ key, content: "", type: MetaType.Dataview });
        }

        return obj;
    }, []);
}
