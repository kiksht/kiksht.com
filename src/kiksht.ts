export interface Example {
    kiksht: string;
    english: string;
}

export interface Form {
    kiksht: string;
    english: string;
}

export type PartOfSpeech =
    | "n"
    | "pron"
    | "vb"
    | "adv"
    | "part"
    | "interj"
    | "place"
    | "rel"
    | "conj"
    | "adj n"
    | "idiom"
    | "num";

export interface Entry {
    root: string;
    partOfSpeech: PartOfSpeech;
    definition: string;
    forms: Form[];
    examples: Example[];
    notes: string[];
    seeAlso: string[];
    pronunciation: string;
}

export interface Dictionary {
    [key: string]: Entry;
}
