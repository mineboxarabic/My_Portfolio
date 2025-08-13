import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface AiTextEditorContextType {
  activeElement: HTMLElement | null;
  updateActiveElementValue: (newValue: string) => void;
  updateMultilingualValue: (multilingualValue: Record<string, string>) => void;
  mousePosition: { x: number; y: number } | null;
  preservedElement: HTMLElement | null;
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
  const [preservedElement, setPreservedElement] = useState<HTMLElement | null>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // If clicking on AI popup, don't update mouse position and clear any blur timeout
    if (target.closest('[data-ai-popup="true"]')) {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      return;
    }
    
    // Check if we're in admin area
    const isInAdmin = window.location.pathname.includes('/admin');
    
    // If not clicking on a text input/textarea and we're in admin, hide the AI popup
    if (isInAdmin && !(
      (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
      target.tagName === 'TEXTAREA' ||
      (target.isContentEditable && target.closest('.ProseMirror'))
    )) {
      // Clear active element and hide popup when clicking on non-text elements
      setActiveElement(null);
      setPreservedElement(null);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    }
    
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleFocusIn = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    
    // Allow focus on AI popup elements but don't change active/preserved elements
    if (target.closest('[data-ai-popup="true"]')) {
      // Clear any pending blur timeout when focusing AI popup elements
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      return;
    }
    
    // Check if we're in admin area - only show AI popup in admin
    const isInAdmin = window.location.pathname.includes('/admin');
    
    if (
      isInAdmin && // Only show in admin area
      (
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
        target.tagName === 'TEXTAREA' ||
        (target.isContentEditable && target.closest('.ProseMirror'))
      )
    ) {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setActiveElement(target);
      setPreservedElement(target); // Always preserve the element when it gains focus
    }
  }, []);

  const handleFocusOut = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // Don't change preserved elements if blurring from AI popup elements
    if (target.closest('[data-ai-popup="true"]')) {
      return;
    }
    
    // Don't hide if user is clicking on AI popup or its children
    if (relatedTarget && relatedTarget.closest('[data-ai-popup="true"]')) {
      // Keep the preserved element but clear the active element temporarily
      // This allows AI popup interaction while maintaining reference to original input
      setActiveElement(preservedElement);
      return;
    }
    
    // Don't hide if user is clicking on any button or interactive element within AI popup
    if (relatedTarget && (
      relatedTarget.tagName === 'BUTTON' ||
      relatedTarget.closest('button') ||
      relatedTarget.closest('[role="button"]') ||
      relatedTarget.hasAttribute('data-ai-popup')
    )) {
      // Keep the preserved element
      setActiveElement(preservedElement);
      return;
    }

    if (target === activeElement) {
      blurTimeoutRef.current = window.setTimeout(() => {
        setActiveElement(null);
        setPreservedElement(null);
      }, 500); // Increased timeout to 500ms for better UX
    }
  }, [activeElement, preservedElement]);

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
    // Use preserved element if active element is null (happens during AI popup interaction)
    const targetElement = activeElement || preservedElement;
    
    if (!targetElement) {
      console.error("Cannot update value: No active element.");
      return;
    }

    // Safety check: Don't update AI popup elements
    if (targetElement.closest('[data-ai-popup="true"]')) {
      console.warn("Attempted to update AI popup element, skipping.");
      return;
    }

    try {
      if (targetElement.isContentEditable) {
        const event = new CustomEvent('ai-update', {
          bubbles: true,
          cancelable: true,
          detail: { value: newValue },
        });
        targetElement.dispatchEvent(event);
      } 
      else if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
        const nativeValueSetter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(targetElement),
          'value'
        )?.set;

        if (!nativeValueSetter) {
          targetElement.value = newValue;
        } else {
          nativeValueSetter.call(targetElement, newValue);
        }

        const inputEvent = new Event('input', { bubbles: true });
        targetElement.dispatchEvent(inputEvent);
      }

      // Focus back on the target element after updating
      targetElement.focus();
      
      // Restore the active element state
      setActiveElement(targetElement);
    } catch (error) {
      console.error('Failed to update element value:', error);
    }
  }, [activeElement, preservedElement]);

  const updateMultilingualValue = useCallback((multilingualValue: Record<string, string>) => {
    const targetElement = activeElement || preservedElement;
    console.log('🔥 Starting multilingual update with:', multilingualValue);
    
    if (!targetElement) {
      console.error("No element to update");
      return;
    }

    try {
      // Get the element ID (like "problem-en")
      const elementId = targetElement.id;
      console.log('Element ID:', elementId);
      
      // Check if it's a multilingual input (has -en, -fr, or -ar)
      const isMultilingual = elementId.includes('-en') || elementId.includes('-fr') || elementId.includes('-ar');
      console.log('Is multilingual?', isMultilingual);
      
      if (isMultilingual) {
        // Get the base name (remove -en, -fr, -ar from the end)
        const baseName = elementId.replace(/-en$|-fr$|-ar$/, '');
        console.log('Base name:', baseName);
        
        // Update English
        if (multilingualValue.en) {
          const enElement = document.getElementById(baseName + '-en');
          if (enElement && (enElement instanceof HTMLInputElement || enElement instanceof HTMLTextAreaElement)) {
            // Use React's native setter to update the value
            const nativeValueSetter = Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(enElement),
              'value'
            )?.set;
            
            if (nativeValueSetter) {
              nativeValueSetter.call(enElement, multilingualValue.en);
            } else {
              enElement.value = multilingualValue.en;
            }
            
            // Trigger React events to update state
            enElement.dispatchEvent(new Event('input', { bubbles: true }));
            enElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Updated English');
          }
        }
        
        // Update French  
        if (multilingualValue.fr) {
          const frElement = document.getElementById(baseName + '-fr');
          if (frElement && (frElement instanceof HTMLInputElement || frElement instanceof HTMLTextAreaElement)) {
            // Use React's native setter to update the value
            const nativeValueSetter = Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(frElement),
              'value'
            )?.set;
            
            if (nativeValueSetter) {
              nativeValueSetter.call(frElement, multilingualValue.fr);
            } else {
              frElement.value = multilingualValue.fr;
            }
            
            // Trigger React events to update state
            frElement.dispatchEvent(new Event('input', { bubbles: true }));
            frElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Updated French');
          }
        }
        
        // Update Arabic
        if (multilingualValue.ar) {
          const arElement = document.getElementById(baseName + '-ar');
          if (arElement && (arElement instanceof HTMLInputElement || arElement instanceof HTMLTextAreaElement)) {
            // Use React's native setter to update the value
            const nativeValueSetter = Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(arElement),
              'value'
            )?.set;
            
            if (nativeValueSetter) {
              nativeValueSetter.call(arElement, multilingualValue.ar);
            } else {
              arElement.value = multilingualValue.ar;
            }
            
            // Trigger React events to update state
            arElement.dispatchEvent(new Event('input', { bubbles: true }));
            arElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Updated Arabic');
          }
        }
        
        console.log('🎉 All updates completed!');
        
      } else {
        // Not multilingual, just update current element
        console.log('Single language update');
        updateActiveElementValue(multilingualValue.en || Object.values(multilingualValue)[0] || '');
      }
      
    } catch (error) {
      console.error('Error:', error);
      // If anything fails, just update the current element
      updateActiveElementValue(multilingualValue.en || Object.values(multilingualValue)[0] || '');
    }
  }, [activeElement, preservedElement, updateActiveElementValue]);

  const value = { activeElement, updateActiveElementValue, updateMultilingualValue, mousePosition, preservedElement };

  return (
    <AiTextEditorContext.Provider value={value}>
      {children}
    </AiTextEditorContext.Provider>
  );
};