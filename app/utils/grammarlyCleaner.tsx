'use client'
import React, { ReactNode } from 'react'
import { useEffect } from 'react'

export function GrammarlyCleanup({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Remove Grammarly attributes from the document body
    const removeGrammarlyAttributes = () => {
      const body = document.body
      body.removeAttribute('data-new-gr-c-s-check-loaded')
      body.removeAttribute('data-gr-ext-installed')
    }

    removeGrammarlyAttributes()
    
    // Optional: Add mutation observer to handle dynamic changes
    const observer = new MutationObserver(removeGrammarlyAttributes)
    observer.observe(document.body, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="grammarly-disable-all">
      {children}
    </div>
  )
}