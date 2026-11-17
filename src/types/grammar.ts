export type GrammarCategory = "spelling" | "grammar" | "punctuation" | "style";

export type GrammarStatus = "idle" | "checking" | "clean" | "has-issues" | "error";

export interface GrammarReplacement {
  value: string;
}

export interface GrammarIssue {
  id: string;
  from: number;
  to: number;
  originalText: string;
  message: string;
  shortMessage?: string;
  category: GrammarCategory;
  categoryName: string;
  replacements: string[];
  ruleId: string;
  ruleDescription?: string;
  sentence?: string;
}

export interface LanguageToolCategory {
  id: string;
  name: string;
}

export interface LanguageToolRule {
  id: string;
  description: string;
  issueType: string;
  category: LanguageToolCategory;
}

export interface LanguageToolMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: GrammarReplacement[];
  rule: LanguageToolRule;
  sentence?: string;
  context?: {
    text: string;
    offset: number;
    length: number;
  };
}

export interface LanguageToolResponse {
  software?: {
    name: string;
    version: string;
    status: string;
  };
  language?: {
    name: string;
    code: string;
  };
  matches: LanguageToolMatch[];
}

export interface CheckGrammarRequest {
  text: string;
  language?: string;
}

export interface CheckGrammarResponse {
  matches: LanguageToolMatch[];
  language?: string;
}

export interface PopupPosition {
  top: number;
  left: number;
  placement?: "top" | "bottom";
}

