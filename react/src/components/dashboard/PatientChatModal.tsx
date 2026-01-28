"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useAuth } from "@/lib/auth"
import { X, Send, AlertCircle, Loader2, MessageSquare } from "lucide-react"

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Props = {
  open: boolean
  onClose: () => void
  patientId: string | null
  patientName?: string
}

export default function PatientChatModal({ open, onClose, patientId, patientName }: Props) {
  const { authFetch } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disclaimer, setDisclaimer] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setMessages([])
      setInput("")
      setError(null)
      setDisclaimer("")
    }
  }, [open])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    
    if (!input.trim() || !patientId || loading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const res = await authFetch('/api/groq/patient-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          question: userMessage.content
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error || 'Failed to get response')
      }

      const data = await res.json()
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I apologize, but I was unable to generate a response.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      if (data.disclaimer) {
        setDisclaimer(data.disclaimer)
      }

    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    setError(null)
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      if (lastUserMessage) {
        setInput(lastUserMessage.content)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ask HealthSync AI
            </h2>
            {patientName && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {patientName}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">Start a conversation</p>
              <p className="text-sm">
                Ask questions about medical terms, existing diagnoses, or general health information.
              </p>
              <p className="text-xs mt-3 text-amber-600 dark:text-amber-500">
                ⚠️ This AI cannot diagnose, prescribe, or provide emergency advice.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="mt-2 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer (always visible when present) */}
        {disclaimer && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {disclaimer}
            </p>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about health information..."
              className="flex-1"
              disabled={loading || !patientId}
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading || !patientId}
              size="icon"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {input.length}/1000 characters
          </p>
        </form>
      </div>
    </div>
  )
}
