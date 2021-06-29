export const rxLastWordOrSpace = /(?:(?<=(?:\s|\W)?)(\w+?)|(\s))?$/; // if last char is space, matches only the space
export const matchHeadingHashes = /(?<=^#*?)#(?=#*\s)/g;
export const getFirstAtSign = /(@(?=@*\S))|@$/;
export const hashPrecedingAt = /#(?=#*@)/g;
export const cleanMarkdown = /(?<!(?:@|\^).*)([^@^\n]+)\s/m;
export const blockRefs = /\^\S+\s?/gm;
export const matchFileName = /(?<=[\/\\]|^)\w+\.?\w*$/m; //also matches when it's just a name, e.g. 'file.md', with no slashes

export const cleanHeading = (input: string) => input.replace(/^#+\s/, "").replace(/\s?\^\S+/, "").replace(/@+.*[^\n]/, "");


export function regexIndexOf(string: string, regex: RegExp, startpos: number) {
    var indexOf = string.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}