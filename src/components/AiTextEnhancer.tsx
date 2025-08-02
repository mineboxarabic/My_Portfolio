import { useState, useEffect, useRef } from 'react';
import { useAiTextEditor } from '@/hooks/useAiTextEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand, Loader2, BrainCircuit, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export const AiTextEnhancer = () => {
  const { activeElement, updateActiveElementValue, updateMultilingualValue, mousePosition, preservedElement } = useAiTextEditor();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'idle' | 'improve' | 'generate' | 'prompting'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [fixedPosition, setFixedPosition] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to detect context based on current page/form
  const detectContext = () => {
    const targetElement = activeElement || preservedElement;
    if (!targetElement) return null;

    // Check URL path to determine context type
    const path = window.location.pathname;
    const elementId = targetElement.id;
    
    if (path.includes('/admin')) {
      // Determine context based on admin page and element
      if (path.includes('/admin') && elementId) {
        
        // Blog context
        if (elementId.includes('title') || elementId.includes('excerpt') || elementId.includes('content')) {
          return { type: 'blogs' };
        }
        
        // Project context - check for project detail manager
        if (path.includes('project') || elementId.includes('problem') || elementId.includes('tagline') || elementId.includes('goal')) {
          // Try to get project ID from URL
          const projectIdMatch = path.match(/project\/([^\/]+)/);
          return { 
            type: projectIdMatch ? 'project_details' : 'projects', 
            id: projectIdMatch ? projectIdMatch[1] : undefined 
          };
        }
        
        // Skills context
        if (elementId.includes('category') || elementId.includes('skill')) {
          return { type: 'skills' };
        }
        
        // About context
        if (elementId.includes('about') || path.includes('about')) {
          return { type: 'about' };
        }
        
        // General project context if we can't be more specific
        if (elementId.includes('name') || elementId.includes('description')) {
          return { type: 'projects' };
        }
      }
    }
    
    return null;
  };

  useEffect(() => {
    const targetElement = activeElement || preservedElement;
    
    if (!targetElement) {
      setIsExpanded(false);
      setMode('idle');
      setPromptText('');
      setFixedPosition(null);
    } else if (mousePosition) {
      const popupWidth = popupRef.current?.offsetWidth || 200;
      const popupHeight = popupRef.current?.offsetHeight || 50;
      
      let left = mousePosition.x + window.scrollX + 15;
      let top = mousePosition.y + window.scrollY + 15;

      // Adjust if it goes off-screen horizontally
      if (left + popupWidth > window.innerWidth + window.scrollX) {
        left = mousePosition.x + window.scrollX - popupWidth - 15;
      }
      // Adjust if it goes off-screen vertically
      if (top + popupHeight > window.innerHeight + window.scrollY) {
        top = mousePosition.y + window.scrollY - popupHeight - 15;
      }

      setFixedPosition({ top, left });
    } else if (targetElement && !fixedPosition) {
      // Fallback positioning if we have an element but no mouse position
      // Position it near the element
      const rect = targetElement.getBoundingClientRect();
      const left = rect.right + window.scrollX + 10;
      const top = rect.top + window.scrollY;
      setFixedPosition({ top, left });
    }
  }, [activeElement, preservedElement, mousePosition, isExpanded, mode]);

  useEffect(() => {
    if (mode === 'prompting' && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [mode]);

  const handleImprove = async () => {
    const targetElement = activeElement || preservedElement;
    if (!targetElement) return;
    
    // Get text content from different element types
    let currentText = '';
    if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
      currentText = targetElement.value;
    } else if (targetElement.isContentEditable) {
      currentText = targetElement.textContent || targetElement.innerText || '';
    }
    
    if (!currentText.trim()) return;
    
    setIsLoading(true);
    setMode('improve');
    try {
      const context = detectContext();
      const { data, error } = await supabase.functions.invoke('ai-text-helper', {
        body: { 
          type: 'improve', 
          text: currentText,
          context: context
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      // Handle multilingual response
      const result = data.result;
      const targetElement = activeElement || preservedElement;
      
      console.log('AI Result:', result);
      console.log('Result type:', typeof result);
      console.log('Has en/fr/ar:', result?.en, result?.fr, result?.ar);
      console.log('Is multilingual input:', isMultilingualInput(targetElement));
      console.log('Target element:', targetElement);
      
      if (typeof result === 'object' && result !== null && result.en && result.fr && result.ar && isMultilingualInput(targetElement)) {
        console.log('Using multilingual update');
        // Use multilingual update for multilingual inputs
        updateMultilingualValue(result);
        showSuccess('Text improved in all languages!');
      } else {
        console.log('Using single language update - reason:', {
          isObject: typeof result === 'object',
          notNull: result !== null,
          hasEn: !!result?.en,
          hasFr: !!result?.fr,
          hasAr: !!result?.ar,
          isMultilingual: isMultilingualInput(targetElement)
        });
        // Fallback to single language update
        const currentLang = i18n.language;
        let textToInsert = '';
        
        if (typeof result === 'string') {
          // If result is a string, use it directly
          textToInsert = result;
        } else if (typeof result === 'object' && result !== null) {
          // If result is an object, try to get the appropriate language
          textToInsert = result[currentLang] || result.en || result.fr || result.ar || JSON.stringify(result);
        } else {
          textToInsert = 'Improved text';
        }
        
        updateActiveElementValue(textToInsert);
        showSuccess('Text improved!');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to improve text.');
    } finally {
      setIsLoading(false);
      setMode('idle');
      setIsExpanded(false);
    }
  };

  const handleGenerate = async () => {
    if (!promptText) return;

    setIsLoading(true);
    setMode('generate');
    try {
      const context = detectContext();
      const { data, error } = await supabase.functions.invoke('ai-text-helper', {
        body: { 
          type: 'generate', 
          prompt: promptText,
          context: context
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      // Handle multilingual response
      const result = data.result;
      const targetElement = activeElement || preservedElement;
      
      console.log('Generate AI Result:', data);
      console.log('Generate Result type:', typeof result);
      console.log('Generate Has en/fr/ar:', result?.en, result?.fr, result?.ar);
      console.log('Generate Is multilingual input:', isMultilingualInput(targetElement));
      console.log('Generate Target element:', targetElement);
      
      if (typeof result === 'object' && result !== null && result.en && result.fr && result.ar && isMultilingualInput(targetElement)) {
        console.log('Generate Using multilingual update');
        // Use multilingual update for multilingual inputs
        updateMultilingualValue(result);
        showSuccess('Text generated in all languages!');
      } else {
        console.log('Generate Using single language update - reason:', {
          isObject: typeof result === 'object',
          notNull: result !== null,
          hasEn: !!result?.en,
          hasFr: !!result?.fr,
          hasAr: !!result?.ar,
          isMultilingual: isMultilingualInput(targetElement)
        });
        // Fallback to single language update
        const currentLang = i18n.language;
        let textToInsert = '';
        
        if (typeof result === 'string') {
          // If result is a string, use it directly
          textToInsert = result;
        } else if (typeof result === 'object' && result !== null) {
          // If result is an object, try to get the appropriate language
          textToInsert = result[currentLang] || result.en || result.fr || result.ar || JSON.stringify(result);
        } else {
          textToInsert = 'Generated text';
        }

        updateActiveElementValue(textToInsert);
        showSuccess('Text generated!');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate text.');
    } finally {
      setIsLoading(false);
      setMode('idle');
      setIsExpanded(false);
      setPromptText('');
    }
  };

  const onPromptSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  // Helper function to check if element has text content
  const hasTextContent = (element: HTMLElement | null): boolean => {
    if (!element) return false;
    
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return !!element.value.trim();
    } else if (element.isContentEditable) {
      const text = element.textContent || element.innerText || '';
      return !!text.trim();
    }
    return false;
  };

  // Helper function to check if the current input is part of a multilingual form
  const isMultilingualInput = (element: HTMLElement | null): boolean => {
    if (!element) {
      console.log('isMultilingualInput: No element');
      return false;
    }
    const elementId = element.id;
    const result = elementId && (elementId.includes('-en') || elementId.includes('-fr') || elementId.includes('-ar'));
    console.log('isMultilingualInput check:', { elementId, result });
    return result;
  };

  const targetElement = activeElement || preservedElement;

  if (!targetElement || !fixedPosition) {
    return null;
  }

  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${fixedPosition.top}px`,
    left: `${fixedPosition.left}px`,
    zIndex: 100,
  };

  const renderContent = () => {
    if (mode === 'prompting') {
      return (
        <form onSubmit={onPromptSubmit} className="flex flex-col items-stretch gap-2 p-2">
          <Textarea
            ref={promptInputRef}
            placeholder="e.g., a short, professional bio for a full-stack developer"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="text-sm min-h-[80px] resize-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                onPromptSubmit(e);
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cmd/Ctrl + Enter</span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMode('idle')}
                disabled={isLoading}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                type="submit"
                disabled={isLoading || !promptText}
                className="h-8 w-8 flex-shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </form>
      );
    }

    if (isExpanded) {
      const isMultilingual = isMultilingualInput(targetElement);
      
      return (
        <div className="p-1 flex items-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode('prompting')}
            disabled={isLoading}
            className="flex items-center gap-1"
            title={isMultilingual ? "Generate text in all languages (EN, FR, AR)" : "Generate text"}
          >
            <Wand className="h-4 w-4" />
            {isMultilingual ? "Generate All" : "Generate"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleImprove}
            disabled={isLoading || !hasTextContent(targetElement)}
            className="flex items-center gap-1"
            title={isMultilingual ? "Improve text in all languages (EN, FR, AR)" : "Improve text"}
          >
            {isLoading && mode === 'improve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isMultilingual ? "Improve All" : "Improve"}
          </Button>
        </div>
      );
    }

    return (
      <div className="p-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsExpanded(true)}
          className="h-8 w-8"
          title="AI Assistant"
        >
          <BrainCircuit className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      data-ai-popup="true"
      className={`bg-background border rounded-lg shadow-lg flex flex-col animate-fade-in ${mode === 'prompting' ? 'w-80' : ''}`}
      onMouseDown={(e) => {
        // Prevent the popup from disappearing when clicking on it
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Prevent click events from bubbling up
        e.stopPropagation();
      }}
    >
      {/* Multilingual indicator */}
      {isMultilingualInput(targetElement) && (
        <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950 border-b text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          Multilingual Mode (EN, FR, AR)
        </div>
      )}
      {renderContent()}
    </div>
  );
};