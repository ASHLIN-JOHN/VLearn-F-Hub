"use client"

import React, { useState } from "react"
import { Copy, Check, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContentRendererProps {
  content: string
}

interface ParsedContent {
  type: 'title' | 'intro' | 'section' | 'paragraph' | 'points' | 'code' | 'summary'
  content: string
  language?: string
}

function parseContent(rawContent: string): ParsedContent[] {
  const sections: ParsedContent[] = []
  const lines = rawContent.split('\n')
  let currentType: ParsedContent['type'] | null = null
  let currentContent: string[] = []
  let codeLanguage = 'javascript'

  const flushCurrent = () => {
    if (currentType && currentContent.length > 0) {
      sections.push({
        type: currentType,
        content: currentContent.join('\n').trim(),
        language: currentType === 'code' ? codeLanguage : undefined
      })
    }
    currentContent = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('##TITLE##')) {
      flushCurrent()
      currentType = 'title'
      const titleContent = trimmedLine.replace('##TITLE##', '').trim()
      if (titleContent) {
        currentContent.push(titleContent)
      }
    } else if (trimmedLine.startsWith('##INTRO##')) {
      flushCurrent()
      currentType = 'intro'
    } else if (trimmedLine.startsWith('##SECTION##')) {
      flushCurrent()
      currentType = 'section'
      const sectionTitle = trimmedLine.replace('##SECTION##', '').trim()
      if (sectionTitle) {
        currentContent.push(sectionTitle)
      }
    } else if (trimmedLine.startsWith('##PARAGRAPH##')) {
      flushCurrent()
      currentType = 'paragraph'
    } else if (trimmedLine.startsWith('##POINTS##')) {
      flushCurrent()
      currentType = 'points'
    } else if (trimmedLine.startsWith('##CODE##')) {
      flushCurrent()
      currentType = 'code'
    } else if (trimmedLine.startsWith('##SUMMARY##')) {
      flushCurrent()
      currentType = 'summary'
    } else if (trimmedLine.startsWith('```')) {
      if (currentType === 'code') {
        const lang = trimmedLine.replace('```', '').trim()
        if (lang) {
          codeLanguage = lang
        }
      }
    } else if (trimmedLine === '```') {
    } else if (currentType) {
      currentContent.push(line)
    }
  }

  flushCurrent()
  return sections
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const highlightCode = (codeStr: string) => {
    const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof']
    const builtins = ['console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Promise', 'JSON', 'Date', 'Error', 'Map', 'Set', 'window', 'document']
    
    return codeStr.split('\n').map((line, lineIndex) => {
      const parts: React.ReactNode[] = []
      let remaining = line
      let keyIndex = 0

      if (remaining.trim().startsWith('//')) {
        return (
          <div key={lineIndex} className="table-row">
            <span className="table-cell text-right pr-4 text-gray-500 select-none w-8 text-xs">{lineIndex + 1}</span>
            <span className="table-cell">
              <span className="text-gray-500 italic">{remaining}</span>
            </span>
          </div>
        )
      }

      const stringRegex = /("[^"]*"|'[^']*'|`[^`]*`)/g
      const segments = remaining.split(stringRegex)

      segments.forEach((segment, segIndex) => {
        if (segment.match(stringRegex)) {
          parts.push(<span key={keyIndex++} className="text-green-400">{segment}</span>)
        } else {
          let processedSegment = segment

          keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
            processedSegment = processedSegment.replace(regex, `###KW###$1###/KW###`)
          })

          builtins.forEach(builtin => {
            const regex = new RegExp(`\\b(${builtin})\\b`, 'g')
            processedSegment = processedSegment.replace(regex, `###BT###$1###/BT###`)
          })

          const funcRegex = /(\w+)(\s*\()/g
          processedSegment = processedSegment.replace(funcRegex, '###FN###$1###/FN###$2')

          const tokenParts = processedSegment.split(/(###KW###|###\/KW###|###BT###|###\/BT###|###FN###|###\/FN###)/)
          let inKeyword = false
          let inBuiltin = false
          let inFunction = false

          tokenParts.forEach((part, partIndex) => {
            if (part === '###KW###') { inKeyword = true; return }
            if (part === '###/KW###') { inKeyword = false; return }
            if (part === '###BT###') { inBuiltin = true; return }
            if (part === '###/BT###') { inBuiltin = false; return }
            if (part === '###FN###') { inFunction = true; return }
            if (part === '###/FN###') { inFunction = false; return }

            if (part) {
              if (inKeyword) {
                parts.push(<span key={keyIndex++} className="text-purple-400 font-medium">{part}</span>)
              } else if (inBuiltin) {
                parts.push(<span key={keyIndex++} className="text-blue-400">{part}</span>)
              } else if (inFunction) {
                parts.push(<span key={keyIndex++} className="text-yellow-300">{part}</span>)
              } else {
                parts.push(<span key={keyIndex++} className="text-gray-200">{part}</span>)
              }
            }
          })
        }
      })

      return (
        <div key={lineIndex} className="table-row hover:bg-gray-700/30">
          <span className="table-cell text-right pr-4 text-gray-500 select-none w-8 text-xs">{lineIndex + 1}</span>
          <span className="table-cell">{parts}</span>
        </div>
      )
    })
  }

  return (
    <div className="relative my-6 rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400 font-medium">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 px-3 text-gray-400 hover:text-white hover:bg-gray-700"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              <span>Copy code</span>
            </>
          )}
        </Button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono">
          <code className="table">
            {highlightCode(code)}
          </code>
        </pre>
      </div>
    </div>
  )
}

function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2)
          return (
            <span 
              key={index} 
              className="font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md"
            >
              {content}
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function BulletPoints({ content }: { content: string }) {
  const points = content.split('\n').filter(line => line.trim().startsWith('-'))
  
  return (
    <ul className="space-y-3 my-4">
      {points.map((point, index) => {
        const text = point.replace(/^-\s*/, '').trim()
        return (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></span>
            <span className="text-gray-700 leading-relaxed">
              <HighlightedText text={text} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function ContentRenderer({ content }: ContentRendererProps) {
  const sections = parseContent(content)

  if (sections.length === 0) {
    const paragraphs = content.split('\n\n').filter(p => p.trim())
    return (
      <div className="prose prose-sm max-w-none space-y-4">
        {paragraphs.map((para, index) => (
          <p key={index} className="text-gray-700 leading-relaxed">
            <HighlightedText text={para.trim()} />
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        switch (section.type) {
          case 'title':
            return (
              <h1 key={index} className="text-2xl font-bold text-gray-900 border-b pb-3 mb-6">
                <HighlightedText text={section.content} />
              </h1>
            )
          
          case 'intro':
            return (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-100">
                <p className="text-gray-700 leading-relaxed text-lg">
                  <HighlightedText text={section.content} />
                </p>
              </div>
            )
          
          case 'section':
            return (
              <h2 key={index} className="text-xl font-semibold text-gray-800 mt-8 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                <HighlightedText text={section.content} />
              </h2>
            )
          
          case 'paragraph':
            return (
              <p key={index} className="text-gray-700 leading-relaxed">
                <HighlightedText text={section.content} />
              </p>
            )
          
          case 'points':
            return <BulletPoints key={index} content={section.content} />
          
          case 'code':
            return <CodeBlock key={index} code={section.content} language={section.language || 'javascript'} />
          
          case 'summary':
            return (
              <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border border-green-100 mt-6">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  <HighlightedText text={section.content} />
                </p>
              </div>
            )
          
          default:
            return null
        }
      })}
    </div>
  )
}
