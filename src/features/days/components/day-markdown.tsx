import Markdown from 'react-markdown'

// Content Markdown allows paragraphs, bold, italics, lists and links only. Raw HTML is dropped, anything
// else (headings, images, tables) is unwrapped to its text, and react-markdown strips unsafe link URLs.
const allowedElements = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a']

export function DayMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 leading-relaxed [&_a]:font-semibold [&_a]:text-module-ink [&_a]:underline [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6">
      <Markdown
        skipHtml
        allowedElements={allowedElements}
        unwrapDisallowed
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </Markdown>
    </div>
  )
}
