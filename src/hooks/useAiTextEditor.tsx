import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface AiTextEditorContextType {
  activeElement: HTMLElement | null;
  updateActiveElementValue: (newValue: string) => void;
  mousePosition: { x: number; y: number } | null;
}

const AiTextEditorContext = createContext<AiTextEditorContextType | null>(null);

export const useAiTextEditor = () => {
  const context = useContext(AiTextEditorContext);
  if (!context) {
    throw new Error('useAiTextEditor must be used within an AiTextEditorProvider');
  }
  return context;
};

export const AiTextEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleFocusIn = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (
      (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
      target.tagName === 'TEXTAREA' ||
      (target.isContentEditable && target.closest('.ProseMirror'))
    ) {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setActiveElement(target);
    }
  }, []);

  const handleFocusOut = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('[data-ai-popup="true"]')) {
      return;
    }

    if (target === activeElement) {
      blurTimeoutRef.current = window.setTimeout(() => {
        setActiveElement(null);
      }, 200);
    }
  }, [activeElement]);

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [handleMouseDown, handleFocusIn, handleFocusOut]);

  const updateActiveElementValue = useCallback((newValue: string) => {
    if (!activeElement) {
      console.error("Cannot update value: No active element.");
      return;
    }

    try {
      if (activeElement.isContentEditable) {
        const event = new CustomEvent('ai-update', {
          bubbles: true,
          cancelable: true,
          detail: { value: newValue },
        });
        activeElement.dispatchEvent(event);
      } 
      else if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        const nativeValueSetter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(activeElement),
          'value'
        )?.set;

        if (!nativeValueSetter) {
          activeElement.value = newValue;
        } else {
          nativeValueSetter.call(activeElement, newValue);
        }

        const inputEvent = new Event('input', { bubbles: true });
        activeElement.dispatchEvent(inputEvent);
      }

      activeElement.focus();
    } catch (error) {
      console.error('Failed to update element value:', error);
    }
  }, [activeElement]);

  const value = { activeElement, updateActiveElementValue, mousePosition };

  return (
    <AiTextEditorContext.Provider value={value}>
      {children}
    </AiTextEditorContext.Provider>
  );
};