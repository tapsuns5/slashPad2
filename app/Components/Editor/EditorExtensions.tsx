"use client";

import { AnyExtension } from '@tiptap/react';
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Blockquote from "@tiptap/extension-blockquote";
import HardBreak from "@tiptap/extension-hard-break";
import { Image as tiptapimage } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Color from '@tiptap/extension-color'
import Dropcursor from "@tiptap/extension-dropcursor";
import { BackColor } from "./extensions/BackgroundColor";
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Details from '@tiptap-pro/extension-details'
import DetailsContent from '@tiptap-pro/extension-details-content'
import DetailsSummary from '@tiptap-pro/extension-details-summary'
import { PlaceholderNode } from './extensions/PlaceholderNode'
import { getHierarchicalIndexes, TableOfContents } from '@tiptap-pro/extension-table-of-contents'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import FileHandler from '@tiptap-pro/extension-file-handler'
import CodeBlock from '@tiptap/extension-code-block'

// Custom Extenion
const CustomCodeBlock = CodeBlock.extend({
  addKeyboardShortcuts() {
    let lastEnterPress = 0;

    return {
      Enter: ({ editor }) => {
        if (!editor.isActive('codeBlock')) return false

        const now = Date.now();
        const isDoubleEnter = (now - lastEnterPress) < 500;
        lastEnterPress = now;

        const { empty, $anchor } = editor.state.selection
        const isLastLine = $anchor.pos === $anchor.end()

        if (empty && isDoubleEnter && isLastLine) {
          editor.chain()
            .insertContent({ type: 'paragraph' })
            .createParagraphNear()
            .focus()
            .run()
          return true
        }

        return false
      },
    }
  },
})

const editorExtensions: AnyExtension[] = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
    codeBlock: false,
  }),
  Document,
  Paragraph,
  Text,
  HardBreak,
  HorizontalRule,
  CustomCodeBlock,
  Blockquote.configure({
    HTMLAttributes: {
      class: 'blockquote',
    },
  }),
  BulletList.configure({
    HTMLAttributes: {
      class: 'editor-bullet-list',
    },
  }),
  OrderedList.configure({
    keepMarks: true,
    HTMLAttributes: {
      class: 'editor-ordered-list',
    },
  }),
  ListItem.configure({
    HTMLAttributes: {
      class: 'editor-list-item',
    },
  }),
  tiptapimage,
  TextStyle,
  Color,
  TaskList,
  Underline,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Placeholder.configure({
    placeholder: 'Type "/" for commands...',
  }),
  Dropcursor.configure({
    color: "var(--drag-hover)",
    width: 2,
  }),
  BackColor.configure({
    types: ["textStyle"],
  }),
  TaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
  }),
  TableHeader,
  TableRow,
  TableCell,
  Details.configure({
    persist: true,
    HTMLAttributes: {
      class: "details",
    },
  }),
  DetailsContent,
  DetailsSummary,
  PlaceholderNode,
  TableOfContents.configure({
    getIndex: getHierarchicalIndexes,
    anchorTypes: ['heading']
  }),
  Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        isAllowedUri: (url, ctx) => {
          try {
            // construct URL
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`)

            // use default validation
            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false
            }

            // disallowed protocols
            const disallowedProtocols = ['ftp', 'file', 'mailto']
            const protocol = parsedUrl.protocol.replace(':', '')

            if (disallowedProtocols.includes(protocol)) {
              return false
            }

            // only allow protocols specified in ctx.protocols
            const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme))

            if (!allowedProtocols.includes(protocol)) {
              return false
            }

            // disallowed domains
            const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
            const domain = parsedUrl.hostname

            if (disallowedDomains.includes(domain)) {
              return false
            }

            // all checks have passed
            return true
          } catch {
            return false
          }
        },
        shouldAutoLink: url => {
          try {
            // construct URL
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`)

            // only auto-link if the domain is not in the disallowed list
            const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com']
            const domain = parsedUrl.hostname

            return !disallowedDomains.includes(domain)
          } catch {
            return false
          }
        },
  }),
  FileHandler.configure({
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    onDrop: (currentEditor, files, pos) => {
      files.forEach(file => {
        const fileReader = new FileReader()

        fileReader.readAsDataURL(file)
        fileReader.onload = () => {
          currentEditor.chain().insertContentAt(pos, {
            type: 'image',
            attrs: {
              src: fileReader.result,
            },
          }).focus().run()
        }
      })
    },
    onPaste: (currentEditor, files, htmlContent) => {
      files.forEach(file => {
        if (htmlContent) {
          // if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
          // you could extract the pasted file from this url string and upload it to a server for example
          console.log(htmlContent) // eslint-disable-line no-console
          return false
        }

        const fileReader = new FileReader()

        fileReader.readAsDataURL(file)
        fileReader.onload = () => {
          currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
            type: 'image',
            attrs: {
              src: fileReader.result,
            },
          }).focus().run()
        }
      })
    },
  }),
];

export default editorExtensions;
