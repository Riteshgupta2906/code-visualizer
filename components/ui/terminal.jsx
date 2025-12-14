"use client";
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { motion, useInView } from "motion/react";
import { BorderBeam } from "./border-beam";

import { cn } from "@/lib/utils"

const SequenceContext = createContext(null)

const useSequence = () => useContext(SequenceContext)

const ItemIndexContext = createContext(null)
const useItemIndex = () => useContext(ItemIndexContext)

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  startOnView = false,
  ...props
}) => {
  const elementRef = useRef(null)
  const isInView = useInView(elementRef, {
    amount: 0.3,
    once: true,
  })

  const sequence = useSequence()
  const itemIndex = useItemIndex()
  const [hasStarted, setHasStarted] = useState(false)
  useEffect(() => {
    if (!sequence || itemIndex === null) return
    if (!sequence.sequenceStarted) return
    if (hasStarted) return
    if (sequence.activeIndex === itemIndex) {
      setHasStarted(true)
    }
  }, [sequence?.activeIndex, sequence?.sequenceStarted, hasStarted, itemIndex])

  const shouldAnimate = sequence ? hasStarted : startOnView ? isInView : true

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: -5 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
      transition={{ duration: 0.3, delay: sequence ? 0 : delay / 1000 }}
      className={cn("grid text-sm font-normal tracking-tight", className)}
      onAnimationComplete={() => {
        if (!sequence) return
        if (itemIndex === null) return
        sequence.completeItem(itemIndex)
      }}
      {...props}>
      {children}
    </motion.div>
  );
}

export const TypingAnimation = ({
  children,
  className,
  duration = 60,
  delay = 0,
  as: Component = "span",
  startOnView = true,
  ...props
}) => {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string. Received:")
  }

  const MotionComponent = useMemo(() =>
    motion.create(Component, {
      forwardMotionProps: true,
    }), [Component])

  const [displayedText, setDisplayedText] = useState("")
  const [started, setStarted] = useState(false)
  const elementRef = useRef(null)
  const isInView = useInView(elementRef, {
    amount: 0.3,
    once: true,
  })

  const sequence = useSequence()
  const itemIndex = useItemIndex()

  useEffect(() => {
    if (sequence && itemIndex !== null) {
      if (!sequence.sequenceStarted) return
      if (started) return
      if (sequence.activeIndex === itemIndex) {
        setStarted(true)
      }
      return
    }

    if (!startOnView) {
      const startTimeout = setTimeout(() => setStarted(true), delay)
      return () => clearTimeout(startTimeout);
    }

    if (!isInView) return

    const startTimeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimeout);
  }, [
    delay,
    startOnView,
    isInView,
    started,
    sequence?.activeIndex,
    sequence?.sequenceStarted,
    itemIndex,
  ])

  useEffect(() => {
    if (!started) return

    let i = 0
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1))
        i++
      } else {
        clearInterval(typingEffect)
        if (sequence && itemIndex !== null) {
          sequence.completeItem(itemIndex)
        }
      }
    }, duration)

    return () => {
      clearInterval(typingEffect)
    };
  }, [children, duration, started])

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-sm font-normal tracking-tight", className)}
      {...props}>
      {displayedText}
    </MotionComponent>
  );
}

export const Terminal = ({
  children,
  className,
  sequence = true,
  startOnView = true,
  copyCommand = ""
}) => {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, {
    amount: 0.3,
    once: true,
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const sequenceHasStarted = sequence ? !startOnView || isInView : false

  const handleCopy = async () => {
    if (!copyCommand) return
    try {
      await navigator.clipboard.writeText(copyCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const contextValue = useMemo(() => {
    if (!sequence) return null
    return {
      completeItem: (index) => {
        setActiveIndex((current) => (index === current ? current + 1 : current))
      },
      activeIndex,
      sequenceStarted: sequenceHasStarted,
    };
  }, [sequence, activeIndex, sequenceHasStarted])

  const wrappedChildren = useMemo(() => {
    if (!sequence) return children
    const array = Children.toArray(children)
    return array.map((child, index) => (
      <ItemIndexContext.Provider key={index} value={index}>
        {child}
      </ItemIndexContext.Provider>
    ));
  }, [children, sequence])

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "bg-background z-0 h-full h-[325px] w-full max-w-lg rounded-xl border-2 border-white/10 ring-1 ring-white/5 relative",
        className
      )}>
      {/* <BorderBeam size={250} duration={12} delay={9} colorFrom="#29d8ff" colorTo="#4a00ff" /> */}
      <div className="border-border flex flex-row items-center justify-between p-4 pb-0">
        <div className="flex flex-row gap-x-2">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
        </div>
        {copyCommand && (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-800"
            title="Copy commands"
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <pre className="p-4">
        <code className="grid gap-y-1 overflow-auto">{wrappedChildren}</code>
      </pre>
    </div>
  )

  if (!sequence) return content

  return (
    <SequenceContext.Provider value={contextValue}>
      {content}
    </SequenceContext.Provider>
  );
}