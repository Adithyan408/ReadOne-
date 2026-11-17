import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node } from "@tiptap/pm/model";
import type { GrammarIssue, LanguageToolMatch } from "../types/grammar";
import { categorizeRule } from "../services/grammarService";

export interface GrammarPluginState {
  enabled: boolean;
  issues: GrammarIssue[];
  decorations: DecorationSet;
  activeIssueId: string | null;
}

export const grammarPluginKey = new PluginKey<GrammarPluginState>("grammarPlugin");

export interface GrammarExtensionOptions {
  enabled?: boolean;
  onSelectIssue?: (issue: GrammarIssue, rect: DOMRect) => void;
  onHoverIssue?: (issue: GrammarIssue | null, rect: DOMRect | null) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    grammar: {
      setGrammarEnabled: (enabled: boolean) => ReturnType;
      setGrammarIssues: (issues: GrammarIssue[]) => ReturnType;
      acceptGrammarIssue: (issueId: string, replacement: string) => ReturnType;
      ignoreGrammarIssue: (issueId: string) => ReturnType;
      clearGrammarIssues: () => ReturnType;
      setActiveGrammarIssue: (issueId: string | null) => ReturnType;
    };
  }
}

/**
 * Extracts plain text from a ProseMirror document while building a mapping array
 * from plain text character offsets to ProseMirror document positions.
 * Correctly accounts for headings, paragraphs, lists, quotes, and inline marks.
 */
export function extractTextWithMapping(doc: Node): {
  text: string;
  offsetToPos: number[];
} {
  let text = "";
  const offsetToPos: number[] = [];

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const nodeText = node.text;
      for (let i = 0; i < nodeText.length; i++) {
        offsetToPos.push(pos + i);
      }
      text += nodeText;
    } else if (node.isBlock) {
      // If we are starting a new block and have preceding text without a newline,
      // add a newline separator so sentences across blocks aren't concatenated into words.
      if (text.length > 0 && !text.endsWith("\n")) {
        offsetToPos.push(pos);
        text += "\n";
      }
    }
    return true;
  });

  return { text, offsetToPos };
}

/**
 * Maps raw LanguageTool matches to TipTap document positions.
 */
export function mapMatchesToIssues(
  matches: LanguageToolMatch[],
  doc: Node,
  offsetToPos: number[],
  ignoredIds: Set<string> = new Set()
): GrammarIssue[] {
  const issues: GrammarIssue[] = [];

  for (let idx = 0; idx < matches.length; idx++) {
    const match = matches[idx];
    const { offset, length, rule, message, shortMessage, replacements, sentence } = match;

    if (offset < 0 || length <= 0) continue;
    if (offset >= offsetToPos.length) continue;

    const from = offsetToPos[offset];
    const lastIndex = Math.min(offset + length - 1, offsetToPos.length - 1);
    const to = offsetToPos[lastIndex] + 1;

    if (from >= to || to > doc.content.size) continue;

    const originalText = doc.textBetween(from, to);
    if (!originalText || !originalText.trim()) continue;

    const { category, categoryName } = categorizeRule(rule);
    const issueId = `${rule.id}:${offset}:${originalText.trim()}`;

    // Skip ignored issues
    if (ignoredIds.has(issueId) || ignoredIds.has(rule.id)) {
      continue;
    }

    issues.push({
      id: issueId,
      from,
      to,
      originalText,
      message,
      shortMessage: shortMessage || rule.description,
      category,
      categoryName,
      replacements: replacements ? replacements.map((r) => r.value).filter(Boolean) : [],
      ruleId: rule.id,
      ruleDescription: rule.description,
      sentence,
    });
  }

  return issues;
}

/**
 * Creates ProseMirror inline decorations for the grammar issues.
 */
function createDecorations(doc: Node, issues: GrammarIssue[], activeIssueId: string | null): DecorationSet {
  const decorations: Decoration[] = [];

  for (const issue of issues) {
    if (issue.from >= issue.to || issue.to > doc.content.size) continue;

    const isActive = issue.id === activeIssueId;
    const deco = Decoration.inline(
      issue.from,
      issue.to,
      {
        class: `grammar-issue grammar-issue-${issue.category}${isActive ? " is-active" : ""}`,
        "data-grammar-id": issue.id,
        "data-category": issue.category,
      },
      {
        issue,
      }
    );

    decorations.push(deco);
  }

  return DecorationSet.create(doc, decorations);
}

export const GrammarExtension = Extension.create<GrammarExtensionOptions>({
  name: "grammar",

  addOptions() {
    return {
      enabled: true,
      onSelectIssue: undefined,
      onHoverIssue: undefined,
    };
  },

  addCommands() {
    return {
      setGrammarEnabled:
        (enabled: boolean) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(grammarPluginKey, {
              type: "SET_ENABLED",
              enabled,
            });
          }
          return true;
        },

      setGrammarIssues:
        (issues: GrammarIssue[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(grammarPluginKey, {
              type: "SET_ISSUES",
              issues,
            });
          }
          return true;
        },

      acceptGrammarIssue:
        (issueId: string, replacement: string) =>
        ({ state, dispatch }) => {
          const pluginState = grammarPluginKey.getState(state);
          if (!pluginState || !pluginState.enabled) return false;

          const issue = pluginState.issues.find((i) => i.id === issueId);
          if (!issue) return false;

          // Double check document bounds and text consistency
          if (issue.from >= issue.to || issue.to > state.doc.content.size) {
            return false;
          }

          const currentText = state.doc.textBetween(issue.from, issue.to);
          // Never apply correction if text has changed since detection
          if (currentText.trim() !== issue.originalText.trim()) {
            return false;
          }

          if (dispatch) {
            const tr = state.tr;

            // Preserve marks (bold, italic, underline, etc.) at the issue location
            const $from = state.doc.resolve(issue.from);
            const marks = $from.marks();
            const replacementNode = state.schema.text(replacement, marks);

            tr.replaceWith(issue.from, issue.to, replacementNode);

            // Filter out accepted issue and map remaining issues positions
            const remainingIssues = pluginState.issues
              .filter((i) => i.id !== issueId)
              .map((i) => {
                const newFrom = tr.mapping.map(i.from);
                const newTo = tr.mapping.map(i.to);
                return { ...i, from: newFrom, to: newTo };
              });

            tr.setMeta(grammarPluginKey, {
              type: "SET_ISSUES",
              issues: remainingIssues,
              activeIssueId: null,
            });

            dispatch(tr);
          }

          return true;
        },

      ignoreGrammarIssue:
        (issueId: string) =>
        ({ state, dispatch }) => {
          const pluginState = grammarPluginKey.getState(state);
          if (!pluginState || !pluginState.enabled) return false;

          if (dispatch) {
            const remainingIssues = pluginState.issues.filter((i) => i.id !== issueId);
            const tr = state.tr;
            tr.setMeta(grammarPluginKey, {
              type: "SET_ISSUES",
              issues: remainingIssues,
              activeIssueId: null,
            });
            dispatch(tr);
          }

          return true;
        },

      clearGrammarIssues:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(grammarPluginKey, {
              type: "SET_ISSUES",
              issues: [],
              activeIssueId: null,
            });
          }
          return true;
        },

      setActiveGrammarIssue:
        (issueId: string | null) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(grammarPluginKey, {
              type: "SET_ACTIVE_ISSUE",
              activeIssueId: issueId,
            });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin<GrammarPluginState>({
        key: grammarPluginKey,

        state: {
          init() {
            return {
              enabled: options.enabled ?? true,
              issues: [],
              decorations: DecorationSet.empty,
              activeIssueId: null,
            };
          },

          apply(tr, prevState, _oldState, newState) {
            const meta = tr.getMeta(grammarPluginKey);

            if (meta && meta.type === "SET_ENABLED") {
              const enabled = Boolean(meta.enabled);
              return {
                enabled,
                issues: enabled ? prevState.issues : [],
                decorations: enabled ? prevState.decorations : DecorationSet.empty,
                activeIssueId: enabled ? prevState.activeIssueId : null,
              };
            }

            if (meta && meta.type === "SET_ISSUES") {
              if (!prevState.enabled) {
                return {
                  ...prevState,
                  issues: [],
                  decorations: DecorationSet.empty,
                  activeIssueId: null,
                };
              }

              const issues = meta.issues as GrammarIssue[];
              const activeIssueId = meta.activeIssueId !== undefined ? meta.activeIssueId : prevState.activeIssueId;
              return {
                ...prevState,
                issues,
                decorations: createDecorations(newState.doc, issues, activeIssueId),
                activeIssueId,
              };
            }

            if (meta && meta.type === "SET_ACTIVE_ISSUE") {
              if (!prevState.enabled) {
                return {
                  ...prevState,
                  activeIssueId: null,
                  decorations: DecorationSet.empty,
                };
              }

              const activeIssueId = meta.activeIssueId as string | null;
              return {
                ...prevState,
                activeIssueId,
                decorations: createDecorations(newState.doc, prevState.issues, activeIssueId),
              };
            }

            // Map decorations forward as document changes
            if (tr.docChanged) {
              if (!prevState.enabled) {
                return {
                  ...prevState,
                  issues: [],
                  decorations: DecorationSet.empty,
                  activeIssueId: null,
                };
              }

              const mappedDecos = prevState.decorations.map(tr.mapping, tr.doc);
              // Map issue positions
              const mappedIssues = prevState.issues.map((i) => ({
                ...i,
                from: tr.mapping.map(i.from),
                to: tr.mapping.map(i.to),
              }));

              return {
                ...prevState,
                issues: mappedIssues,
                decorations: mappedDecos,
              };
            }

            return prevState;
          },
        },

        props: {
          decorations(state) {
            const pluginState = grammarPluginKey.getState(state);
            if (!pluginState || !pluginState.enabled) {
              return DecorationSet.empty;
            }
            return pluginState.decorations;
          },

          handleClick(view, _pos, event) {
            const pluginState = grammarPluginKey.getState(view.state);
            if (!pluginState || !pluginState.enabled) {
              return false;
            }

            const target = (event.target as HTMLElement | null)?.closest(".grammar-issue") as HTMLElement | null;

            if (target) {
              const issueId = target.getAttribute("data-grammar-id");
              if (issueId) {
                const issue = pluginState.issues.find((i) => i.id === issueId);
                if (issue && options.onSelectIssue) {
                  const rect = target.getBoundingClientRect();
                  options.onSelectIssue(issue, rect);
                  return true;
                }
              }
            } else if (options.onSelectIssue) {
              // Clicked elsewhere in editor, clear popup
              // (will be handled by popup close)
            }

            return false;
          },
        },
      }),
    ];
  },
});
