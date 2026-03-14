'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ListFilter, X } from 'lucide-react';
import { nanoid } from 'nanoid'; // Utility for generating unique IDs

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useHtmlParserStore } from '@/lib/store';
import { ExtractionAttribute, ExtractionRule, ExtractedElement } from '@/lib/types';
import { cn } from '@/lib/utils';

// Helper function to validate rule form
const validateRuleForm = (form: { selector: string; attribute: string; customAttribute: string; label: string }) => {
  if (!form.selector.trim()) {
    return 'Selector cannot be empty.';
  }
  if (!form.label.trim()) {
    return 'Label cannot be empty.';
  }
  if (form.attribute === '' || form.attribute === 'custom' && !form.customAttribute.trim()) {
    return 'Please select an attribute or specify a custom attribute name.';
  }
  return null;
};

export const ElementExtraction = () => {
  const {
    htmlInput,
    domTree,
    extractionRules,
    extractedData,
    extractionLoading,
    addExtractionRule,
    updateExtractionRule,
    removeExtractionRule,
    setExtractionLoading,
    setExtractedData,
  } = useHtmlParserStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    selector: '',
    attribute: '' as ExtractionAttribute | 'custom',
    customAttribute: '',
    label: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = useMemo(() => !!currentRuleId, [currentRuleId]);

  // Reset form when dialog opens/closes or rule is set for editing
  React.useEffect(() => {
    if (!isDialogOpen) {
      setRuleForm({
        selector: '',
        attribute: '' as ExtractionAttribute | 'custom',
        customAttribute: '',
        label: '',
      });
      setCurrentRuleId(null);
      setFormError(null);
    } else if (currentRuleId) {
      const rule = extractionRules.find(r => r.id === currentRuleId);
      if (rule) {
        let attributeValue: ExtractionAttribute | 'custom' = rule.attribute;
        let customAttr = '';
        if (rule.attribute !== 'text' && rule.attribute !== 'html') {
          attributeValue = 'custom';
          customAttr = rule.attribute;
        }
        setRuleForm({
          selector: rule.selector,
          attribute: attributeValue,
          customAttribute: customAttr,
          label: rule.label,
        });
      }
    }
  }, [isDialogOpen, currentRuleId, extractionRules]);

  const handleOpenDialog = (rule?: ExtractionRule) => {
    if (rule) {
      setCurrentRuleId(rule.id);
    } else {
      setCurrentRuleId(null);
    }
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    const error = validateRuleForm(ruleForm);
    if (error) {
      setFormError(error);
      return;
    }

    const attributeToSave: ExtractionAttribute = ruleForm.attribute === 'custom'
      ? ruleForm.customAttribute
      : ruleForm.attribute as ExtractionAttribute;

    const newRule: Omit<ExtractionRule, 'id'> = {
      selector: ruleForm.selector.trim(),
      attribute: attributeToSave,
      label: ruleForm.label.trim(),
    };

    if (isEditing && currentRuleId) {
      updateExtractionRule(currentRuleId, newRule);
    } else {
      addExtractionRule(newRule);
    }
    setIsDialogOpen(false);
  };

  const handleRunExtraction = async () => {
    if (!htmlInput || !domTree || extractionRules.length === 0) {
      return;
    }

    setExtractionLoading(true);
    setExtractedData([]); // Clear previous results

    // Simulate worker-based extraction or call an internal parsing function.
    // In a real scenario, this would likely dispatch an action to the store
    // which then communicates with a Web Worker to perform the actual DOM traversal
    // and data extraction, asynchronously updating `extractedData`.
    // For this component, we directly call a hypothetical client-side extraction function.

    // A simple, browser-based extraction (for demonstration, a real solution might use JSDOM in worker)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, 'text/html');
      const extractedResults: ExtractedElement[] = [];

      extractionRules.forEach(rule => {
        const elements = doc.querySelectorAll(rule.selector);
        elements.forEach((element, index) => {
          let value: string | null = null;
          if (rule.attribute === 'text') {
            value = element.textContent;
          } else if (rule.attribute === 'html') {
            value = element.innerHTML;
          } else {
            value = element.getAttribute(rule.attribute);
          }

          // Generate a simple context path for display
          let contextPath = [];
          let current: Element | null = element;
          while (current && current !== doc.documentElement && current !== doc.body) {
              contextPath.unshift(current.tagName.toLowerCase() + (current.id ? `#${current.id}` : ''));
              current = current.parentElement;
          }

          extractedResults.push({
            id: nanoid(),
            ruleId: rule.id,
            selector: rule.selector,
            attribute: rule.attribute,
            value: value,
            nodeId: `simulated-node-${nanoid()}`, // Placeholder as we don't have direct DOMTreeNode IDs here
            contextPath: contextPath.join(' > '),
          });
        });
      });
      setExtractedData(extractedResults);
    } catch (error: any) {
      console.error('Error during client-side extraction:', error);
      // In a real app, you might want to show this error to the user
      setExtractedData([]);
    } finally {
      setExtractionLoading(false);
    }
  };

  const canRunExtraction = useMemo(() => {
    return htmlInput && domTree && extractionRules.length > 0;
  }, [htmlInput, domTree, extractionRules.length]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-brand" />
          Element Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
        {/* Extraction Rules */}
        <div className="flex flex-col space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold">Extraction Rules ({extractionRules.length})</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Extraction Rule' : 'Add Extraction Rule'}</DialogTitle>
                  <DialogDescription>
                    Define a rule to extract data from your HTML.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="selector" className="text-right">
                      Selector
                    </Label>
                    <Input
                      id="selector"
                      placeholder="e.g., .product-title, #main a"
                      className="col-span-3"
                      value={ruleForm.selector}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, selector: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attribute" className="text-right">
                      Extract
                    </Label>
                    <Select
                      value={ruleForm.attribute}
                      onValueChange={(value: ExtractionAttribute | 'custom') => setRuleForm(prev => ({ ...prev, attribute: value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select attribute or content" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Content (textContent)</SelectItem>
                        <SelectItem value="html">Inner HTML (innerHTML)</SelectItem>
                        <SelectItem value="custom">Custom Attribute...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {ruleForm.attribute === 'custom' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="custom-attribute" className="text-right">
                        Attribute Name
                      </Label>
                      <Input
                        id="custom-attribute"
                        placeholder="e.g., href, src, data-id"
                        className="col-span-3"
                        value={ruleForm.customAttribute}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, customAttribute: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="label" className="text-right">
                      Label
                    </Label>
                    <Input
                      id="label"
                      placeholder="e.g., Product Titles"
                      className="col-span-3"
                      value={ruleForm.label}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>
                  {formError && (
                    <p className="text-destructive text-sm text-center col-span-4 mt-2">{formError}</p>
                  )}
                </div>
                <Button onClick={handleSaveRule}>{isEditing ? 'Save Changes' : 'Add Rule'}</Button>
              </DialogContent>
            </Dialog>
          </div>
          {extractionRules.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No extraction rules defined. Click "Add Rule" to create one.</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {extractionRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{rule.label}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{rule.selector}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="brand" className="text-xs">
                      {rule.attribute}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Rule</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeExtractionRule(rule.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Rule</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Extraction Trigger */}
        <div className="flex-shrink-0">
          <Button
            onClick={handleRunExtraction}
            disabled={!canRunExtraction || extractionLoading}
            loading={extractionLoading}
            className="w-full"
          >
            {extractionLoading ? 'Extracting...' : 'Run Extraction'}
          </Button>
          {!htmlInput && <p className="text-xs text-muted-foreground mt-1 text-center">Paste HTML content first to enable extraction.</p>}
          {htmlInput && !domTree && <p className="text-xs text-muted-foreground mt-1 text-center">HTML needs to be parsed before extraction.</p>}
          {htmlInput && domTree && extractionRules.length === 0 && <p className="text-xs text-muted-foreground mt-1 text-center">Add at least one extraction rule.</p>}
        </div>

        <Separator />

        {/* Extracted Data Display */}
        <div className="flex flex-col space-y-2 flex-grow min-h-0">
          <h3 className="text-md font-semibold">Extracted Data ({extractedData.length})</h3>
          {extractionLoading && <p className="text-sm text-muted-foreground italic">Extraction in progress...</p>}
          {!extractionLoading && extractedData.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No data extracted yet. Define rules and run extraction.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-grow">
              {extractedData.map((item) => {
                const rule = extractionRules.find(r => r.id === item.ruleId);
                return (
                  <div key={item.id} className="flex flex-col p-2 border rounded-md bg-secondary/20 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-brand">{rule?.label || 'Unnamed Rule'}</span>
                      <Badge variant="outline" className="text-xs">{item.attribute}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[calc(100%-20px)]">Selector: <span className="font-mono">{item.selector}</span></p>
                    {item.contextPath && (
                        <p className="text-xs text-muted-foreground truncate max-w-[calc(100%-20px)]">Path: <span className="font-mono">{item.contextPath}</span></p>
                    )}
                    <div className="mt-1 p-2 bg-background border rounded-md max-h-24 overflow-y-auto break-words text-wrap custom-scrollbar">
                      {item.value === null ? (
                        <span className="text-muted-foreground italic">null</span>
                      ) : (
                        item.value
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};