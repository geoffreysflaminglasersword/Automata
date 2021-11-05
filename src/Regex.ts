
export const rxLastWordOrSpace = /(?:(?<=(?:\s|\W)?)(\w+?)|(\s))?$/; // if last char is space, matches only the space
export const matchHeadingHashes = /(?<=^#*?)#(?=#*\s)/g;
export const getFirstAtSign = /(@(?=@*\S))|@$/;
export const hashPrecedingAt = /#(?=#*@)/g;

export const cleanMarkdown = /(?<!(?:@|\^).*)([^@^\n]+)\s/m;
export const blockRefs = /\^\S+\s?/gm;
export const matchFileName = /(?<=[\/\\]|^)\w+\.?\w*$/m; //also matches when it's just a name, e.g. 'file.md', with no slashes

export const matchYaml = /^---(?:.*\n)*?---/;
export const matchYamlEnd = /(^---.*?)(---)/sm;
export const hasYaml = (contents: string) => matchYaml.test(contents);

export const getYamlProp = (prop: string) =>
    new RegExp(`(^---(?:.*\\n)*?${prop}: ?)(.*)(\\n(.*(?:\\n|$))*)`);
export const getYamlSub = (parent: string, child: string) =>
    new RegExp(`(^---(?:.*?\\n)*?${parent}:(?:.*\\n)+?.* - ${child}: )(.+)((?:.*(?:\\n|$))*)`);

export const replaceYamlProp = (contents: string, prop: string, newValue: string) =>
    nullReplace(contents, getYamlProp(prop), `$1${newValue}$3`);
export const replaceYamlSubproperty = (contents: string, parent: string, child: string, newValue: string) =>
    nullReplace(contents, getYamlSub(parent, child), `$1${newValue}$3`);

export const nullReplace = (input: string, regex: RegExp, replace: string) => {
    let replaced = input.search(regex) >= 0;
    return replaced ? input.replace(regex, replace) : null;
};

export const cleanHeading = (input: string) => input.replace(/^#+\s/, "").replace(/\s?\^\S+/, "").replace(/@+.*[^\n]/, "");


export function regexIndexOf(string: string, regex: RegExp, startpos: number) {
    let indexOf = string.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}