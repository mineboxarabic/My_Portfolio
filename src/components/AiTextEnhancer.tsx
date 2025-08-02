import { useState, useEffect, useRef } from 'react';
import { useAiTextEditor } from '@/hooks/useAiTextEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand, Loader2, BrainCircuit, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const AiTextEnhancer = () => {
  const { activeElement, updateActiveElementValue, mousePosition } = useAiTextEditor();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'idle' | 'improve' | 'generate' | 'prompting'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [fixedPosition, setFixedPosition] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!activeElement) {
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
    }
  }, [activeElement, mousePosition, isExpanded, mode]);

  useEffect(() => {
    if (mode === 'prompting' && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [mode]);

  const handleImprove = async () => {
    if (!activeElement || !activeElement.value) return;
    setIsLoading(true);
    setMode('improve');
    try {
      const { data, error } = await supabase.functions.invoke('ai-text-helper', {
        body: { type: 'improve', text: activeElement.value },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      updateActiveElementValue(data.result);
      showSuccess('Text improved!');
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
      const { data, error } = await supabase.functions.invoke('ai-text-helper', {
        body: { type: 'generate', prompt: promptText },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      updateActiveElementValue(data.result);
      showSuccess('Text generated!');
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

  if (!activeElement || !fixedPosition) {
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
      return (
        <div className="p-1 flex items-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode('prompting')}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Wand className="h-4 w-4" />
            Generate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleImprove}
            disabled={isLoading || !activeElement.value}
            className="flex items-center gap-1"
          >
            {isLoading && mode === 'improve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Improve
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
      className={`bg-background border rounded-lg shadow-lg flex animate-fade-in ${mode === 'prompting' ? 'w-80' : ''}`}
    >
      {renderContent()}
    </div>
  );
};