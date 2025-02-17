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
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import Details from '@tiptap-pro/extension-details'
import DetailsContent from '@tiptap-pro/extension-details-content'
import DetailsSummary from '@tiptap-pro/extension-details-summary'
import UniqueID from '@tiptap-pro/extension-unique-id'

const lowlight = createLowlight(all);

const editorExtensions: AnyExtension[] = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
  Document,
  Paragraph,
  Text,
  HardBreak,
  Blockquote,
  BulletList.configure({
    HTMLAttributes: {
      class: 'editor-bullet-list',
    },
  }),
  OrderedList,
  ListItem,
  Link,
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
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Details.configure({
    persist: true,
    HTMLAttributes: {
      class: "details",
    },
  }),
  DetailsContent,
  DetailsSummary,
  UniqueID.configure({
    types: ["heading", "paragraph", "bulletList", "orderedList", "taskList", "table", "details", "codeBlock", "taskItem", "tableRow", "tableCell"],
    attributeName: "uid",
    generateID: () => {
      const uid = crypto.randomUUID(); // Use native UUID generation
      console.log('Generated UID:', uid);
      return uid;
    },
  }),
];

export default editorExtensions;
