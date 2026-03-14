'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Eraser, PlusCircle, Trash2, Settings, Output, Info } from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// CleaningRule definition (inferred from context, as it's not fully provided in types.ts snippet)
export type CleaningAction =
  | 'remove-tag'        // Removes the tag and its children
  | 'strip-attributes'  // Removes all attributes from matched elements
  | 'allow-attributes'; // Allows only specified attributes, removes others

export interface CleaningRule {
  id: string;
  selector: string; // CSS selector for elements to clean
  action: CleaningAction;
  attributes?: string; // Comma-separated string of allowed attributes for 'allow-attributes' action
}

export const HtmlCleaningSanitization = () => {
  const {
    cleaningRules,
    sanitizeOptions,
    sanitizedHtml,
    addCleaningRule,
    updateCleaningRule,
    removeCleaningRule,
    setSanitizeOption,
  } = useHtmlParserStore();

  const [newRuleSelector, setNewRuleSelector] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<CleaningAction>('remove-tag');
  const [newRuleAttributes, setNewRuleAttributes] = useState('');

  const handleAddRule = () => {
    if (newRuleSelector.trim()) {
      addCleaningRule({
        id: crypto.randomUUID(),
        selector: newRuleSelector.trim(),
        action: newRuleAction,
        attributes: newRuleAction === 'allow-attributes' ? newRuleAttributes.trim() : undefined,
      });
      setNewRuleSelector('');
      setNewRuleAttributes('');
      setNewRuleAction('remove-tag'); // Reset action as well
    }
  };

  const handleUpdateRule = (id: string, field: keyof CleaningRule, value: string | CleaningAction) => {
    updateCleaningRule(id, { [field]: value });
  };

  // Convert array options from store to comma-separated string for Input fields
  const currentForbiddenTags = (sanitizeOptions.FORBID_TAGS as string[] | undefined)?.join(', ') || '';
  const currentForbiddenAttrs = (sanitizeOptions.FORBID_ATTR as string[] | undefined)?.join(', ') || '';
  const currentAllowedTags = (sanitizeOptions.ALLOWED_TAGS as string[] | undefined)?.join(', ') || '';
  const currentAllowedAttrs = (sanitizeOptions.ALLOWED_ATTR as string[] | undefined)?.join(', ') || '';
  const currentAllowHtml = sanitizeOptions.ALLOW_HTML === true;

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">HTML Cleaning & Sanitization</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {/* Cleaning Rules Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Eraser className="w-5 h-5 text-brand" /> Cleaning Rules
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Define rules to remove or modify specific elements and attributes in the HTML before global sanitization.
          </p>

          {/* Add New Rule Form */}
          <div className="border p-4 rounded-md bg-muted/20 mb-6">
            <h4 className="font-medium mb-3">Add New Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="CSS Selector"
                placeholder="e.g., script, div.ad, [data-remove]"
                value={newRuleSelector}
                onChange={(e) => setNewRuleSelector(e.target.value)}
              />
              <Select
                value={newRuleAction}
                onValueChange={(value: CleaningAction) => setNewRuleAction(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remove-tag">Remove Tag & Children</SelectItem>
                  <SelectItem value="strip-attributes">Strip All Attributes</SelectItem>
                  <SelectItem value="allow-attributes">Allow Specific Attributes</SelectItem>
                </SelectContent>
              </Select>
              {newRuleAction === 'allow-attributes' && (
                <Input
                  label="Allowed Attributes (comma-separated)"
                  placeholder="e.g., href, src, alt"
                  value={newRuleAttributes}
                  onChange={(e) => setNewRuleAttributes(e.target.value)}
                />
              )}
            </div>
            <Button onClick={handleAddRule} disabled={!newRuleSelector.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </div>

          {/* Existing Rules List */}
          <div>
            <h4 className="font-medium mb-3">Existing Rules ({cleaningRules.length})</h4>
            {cleaningRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cleaning rules defined yet.</p>
            ) : (
              <div className="space-y-3">
                {cleaningRules.map((rule) => (
                  <div key={rule.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 border rounded-md bg-background">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div>
                        <Label className="text-muted-foreground text-xs">Selector</Label>
                        <Input
                          value={rule.selector}
                          onChange={(e) => handleUpdateRule(rule.id, 'selector', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Action</Label>
                        <Select
                          value={rule.action}
                          onValueChange={(value: CleaningAction) => handleUpdateRule(rule.id, 'action', value)}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remove-tag">Remove Tag & Children</SelectItem>
                            <SelectItem value="strip-attributes">Strip All Attributes</SelectItem>
                            <SelectItem value="allow-attributes">Allow Specific Attributes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {rule.action === 'allow-attributes' && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Allowed Attributes</Label>
                          <Input
                            value={rule.attributes || ''}
                            onChange={(e) => handleUpdateRule(rule.id, 'attributes', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="e.g., href, src"
                          />
                        </div>
                      )}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(rule.id)} className="shrink-0">
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove Rule</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Separator label="Global Sanitization Options" />

        {/* Sanitization Options Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand" /> DOMPurify Configuration
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure global DOMPurify options for additional security and control over the final HTML output.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Forbidden Tags (comma-separated)"
              placeholder="e.g., script, iframe, style"
              value={currentForbiddenTags}
              onChange={(e) =>
                setSanitizeOption('FORBID_TAGS', e.target.value.split(',').map(s => s.trim()).filter(Boolean))
              }
              hint="These tags will be removed entirely."
            />
            <Input
              label="Forbidden Attributes (comma-separated)"
              placeholder="e.g., onclick, style, onload"
              value={currentForbiddenAttrs}
              onChange={(e) =>
                setSanitizeOption('FORBID_ATTR', e.target.value.split(',').map(s => s.trim()).filter(Boolean))
              }
              hint="These attributes will be stripped from all tags."
            />
            <Input
              label="Allowed Tags (comma-separated)"
              placeholder="e.g., p, a, div, span"
              value={currentAllowedTags}
              onChange={(e) =>
                setSanitizeOption('ALLOWED_TAGS', e.target.value.split(',').map(s => s.trim()).filter(Boolean))
              }
              hint="Only these tags will be permitted (overrides FORBID_TAGS). If empty, all non-forbidden are allowed."
            />
            <Input
              label="Allowed Attributes (comma-separated)"
              placeholder="e.g., href, src, alt, class"
              value={currentAllowedAttrs}
              onChange={(e) =>
                setSanitizeOption('ALLOWED_ATTR', e.target.value.split(',').map(s => s.trim()).filter(Boolean))
              }
              hint="Only these attributes will be permitted (overrides FORBID_ATTR). If empty, all non-forbidden are allowed."
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-html-switch"
                checked={currentAllowHtml}
                onCheckedChange={(checked) => setSanitizeOption('ALLOW_HTML', checked)}
              />
              <Label htmlFor="allow-html-switch" className="whitespace-nowrap">Allow HTML (Dangerous)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Setting this to `true` (which is DOMPurify's default) allows standard HTML. Setting it to `false`
                      would mean DOMPurify returns an empty string or attempts to convert it to plain text, which is
                      usually not the desired behavior when sanitizing HTML. It's generally safer to define
                      `ALLOWED_TAGS` and `ALLOWED_ATTR` explicitly.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </section>

        <Separator label="Sanitized HTML Output" />

        {/* Sanitized HTML Output */}
        <section className="flex-1 flex flex-col min-h-[200px]">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Output className="w-5 h-5 text-brand" /> Sanitized Output
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The resulting HTML after applying all cleaning rules and global sanitization options.
          </p>
          <div className="flex-1">
            <Textarea
              label="Sanitized HTML"
              value={sanitizedHtml}
              readOnly
              rows={10}
              className="font-mono text-xs resize-none h-full min-h-[150px]"
              placeholder="Sanitized HTML will appear here..."
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
};