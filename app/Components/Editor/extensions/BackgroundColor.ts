import { Extension } from "@tiptap/core";
// import { TextStyle } from "@tiptap/extension-text-style";
// import { Node } from 'prosemirror-model';
// import { EditorState } from 'prosemirror-state';
// import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';

export type ColorOptions = {
    types: string[];
};

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        backColor: {
            /**
             * Set the text color
             */
            setBackColor: (color: string) => ReturnType;
            /**
             * Unset the text color
             */
            unsetBackColor: () => ReturnType;
        };
    }
}

export const BackColor = Extension.create<ColorOptions>({
    name: "backColor",

    addOptions() {
        return {
            types: ["textStyle", "tableCell"],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    backgroundColor: {
                        default: null,
                        parseHTML: (element) =>
                            element.style.backgroundColor?.replace(/['"]+/g, ""),
                        renderHTML: (attributes) => {
                            if (!attributes.backgroundColor) {
                                return {};
                            }

                            return {
                                style: `background-color: ${attributes.backgroundColor}`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setBackColor:
                (color) =>
                ({ chain }) => {
                    return chain()
                        .setMark("textStyle", { backgroundColor: color })
                        .updateAttributes('tableCell', { backgroundColor: color })
                        .run();
                },
            unsetBackColor:
                () =>
                ({ chain }) => {
                    return chain()
                        .setMark("textStyle", { backgroundColor: null })
                        .updateAttributes('tableCell', { backgroundColor: null })
                        .removeEmptyTextStyle()
                        .run();
                },
        };
    },
});