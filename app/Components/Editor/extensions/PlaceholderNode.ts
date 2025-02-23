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

export const PlaceholderNode = Extension.create({
  name: 'placeholderNode',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholderNode'),
        props: {
          decorations: ({ doc, selection }) => {
            const decorations: Decoration[] = []
            
            // Only show placeholders if there's actual content in the document
            const hasContent = doc.textContent.length > 0
            
            doc.descendants((node, pos) => {
              const isEmpty = node.content.size === 0
              const isCurrentNode = selection.from >= pos && selection.from <= (pos + node.nodeSize)
              const isNotDefaultParagraph = node.type.name !== 'paragraph' || hasContent

              if (isEmpty && isCurrentNode && isNotDefaultParagraph) {
                let placeholder = ''

                if (node.type.name === 'heading') {
                  placeholder = placeholderText[`heading${node.attrs.level}`]
                } else if (node.type.name in placeholderText) {
                  placeholder = placeholderText[node.type.name]
                }

                if (placeholder) {
                  decorations.push(
                    Decoration.widget(pos + 1, () => {
                      const span = document.createElement('span')
                      span.className = 'node-placeholder'
                      span.textContent = placeholder
                      return span
                    }, { key: 'placeholder' })
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