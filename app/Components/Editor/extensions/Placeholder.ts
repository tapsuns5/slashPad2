import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const placeholderText: Record<string, string> = {
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  paragraph: 'Type something...',
  bulletList: 'List item',
  orderedList: 'Numbered item',
  taskList: 'Task item',
  blockquote: 'Enter a quote',
  codeBlock: 'Enter code',
}

export const Placeholder = Extension.create({
  name: 'placeholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations: ({ doc, selection }) => {
            const decorations: Decoration[] = []
            
            doc.descendants((node, pos) => {
              const isEmpty = node.content.size === 0
              const isCurrentNode = selection.from >= pos && selection.from <= (pos + node.nodeSize)

              if (isEmpty && isCurrentNode) {
                let placeholder = ''

                // Handle heading nodes
                if (node.type.name === 'heading') {
                  placeholder = placeholderText[`heading${node.attrs.level}`] || `Heading ${node.attrs.level}`
                } 
                // Handle other node types
                else if (node.type.name in placeholderText) {
                  placeholder = placeholderText[node.type.name]
                }

                if (placeholder) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: 'placeholder',
                      'data-placeholder': placeholder
                    })
                  )
                }
              }
            })

            return DecorationSet.create(doc, decorations)
          }
        }
      })
    ]
  }
})