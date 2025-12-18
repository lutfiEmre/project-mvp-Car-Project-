'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileJson,
  FileCode,
  Check,
  AlertCircle,
  Download,
  HelpCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'json' | 'xml') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'json' && !file.name.endsWith('.json')) {
        toast.error('Please select a JSON file');
        return;
      }
      if (type === 'xml' && !file.name.endsWith('.xml')) {
        toast.error('Please select an XML file');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleJsonImport = async () => {
    if (!jsonData.trim()) {
      toast.error('Please enter JSON data');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const vehicles = JSON.parse(jsonData);
      
      if (!Array.isArray(vehicles)) {
        throw new Error('JSON must be an array of vehicles');
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/import/json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vehicles }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      toast.success(`Successfully imported ${result.success} vehicles`);
      
      if (result.failed > 0) {
        toast.warning(`Failed to import ${result.failed} vehicles`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import vehicles');
      setImportResult({
        success: 0,
        failed: 0,
        errors: [error.message],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleXmlImport = async () => {
    if (!selectedFile) {
      toast.error('Please select an XML file');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/import/xml`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      toast.success(`Successfully imported ${result.success} vehicles`);
      
      if (result.failed > 0) {
        toast.warning(`Failed to import ${result.failed} vehicles`);
      }
      
      setSelectedFile(null);
      if (xmlFileInputRef.current) {
        xmlFileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import vehicles');
      setImportResult({
        success: 0,
        failed: 0,
        errors: [error.message],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Import Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Bulk import your vehicle inventory from XML or JSON files
        </p>
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="url">URL Import</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Import</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload XML File</CardTitle>
              <CardDescription>
                Upload your inventory XML file. Maximum file size: 10MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="xml-file">XML File</Label>
                <div className="flex gap-2">
                  <Input
                    id="xml-file"
                    ref={xmlFileInputRef}
                    type="file"
                    accept=".xml"
                    onChange={(e) => handleFileSelect(e, 'xml')}
                    disabled={importing}
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        if (xmlFileInputRef.current) {
                          xmlFileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleXmlImport}
                disabled={!selectedFile || importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import XML
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON Import</CardTitle>
              <CardDescription>
                Paste your JSON data directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-data">JSON Data</Label>
                <textarea
                  id="json-data"
                  className="w-full min-h-[200px] p-3 rounded-md border bg-background text-sm font-mono"
                  placeholder='[{"make": "Toyota", "model": "Camry", "year": 2024, ...}]'
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  disabled={importing}
                />
              </div>

              <Button
                onClick={handleJsonImport}
                disabled={!jsonData.trim() || importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Import JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle>Import Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-emerald-50 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        Successful
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {importResult.success}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900 dark:text-red-100">
                        Failed
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {importResult.failed}
                    </p>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Errors:</h4>
                    <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-700 dark:text-red-300">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-2xl p-12 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">
                  Drag and drop your file here
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="gap-2">
                    <FileJson className="h-4 w-4" />
                    Select JSON
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <FileCode className="h-4 w-4" />
                    Select XML
                  </Button>
                </div>
              </div>

              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800 p-6"
                >
                  <h4 className="font-semibold mb-4">Import Results</h4>
                  <div className="flex gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                        <Check className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{importResult.success}</p>
                        <p className="text-xs text-muted-foreground">Successful</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{importResult.failed}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-500">Errors:</p>
                      {importResult.errors.map((error, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              <div className="mt-6 flex justify-end gap-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
                <Button
                  onClick={handleXmlImport}
                  disabled={importing}
                  className="gap-2"
                >
                  {importing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Start Import
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                File Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Required Fields</h4>
                  <div className="flex flex-wrap gap-2">
                    {['make', 'model', 'year', 'price', 'mileage'].map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Fields</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'vin',
                      'stockNumber',
                      'trim',
                      'description',
                      'exteriorColor',
                      'interiorColor',
                      'fuelType',
                      'transmission',
                      'driveType',
                      'bodyType',
                      'images',
                    ].map((field) => (
                      <Badge key={field} variant="outline">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import from URL</CardTitle>
              <CardDescription>
                Enter a URL to your XML or JSON feed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Feed URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/inventory.xml"
                  className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
                />
              </div>
              <Button>Validate & Import</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Imports</CardTitle>
              <CardDescription>
                Set up automatic imports from your inventory feed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-gradient-to-r from-primary/10 to-coral-500/10 p-6 text-center">
                <h3 className="font-semibold mb-2">
                  Upgrade to Professional
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scheduled imports are available on Professional and Enterprise plans
                </p>
                <Button>Upgrade Now</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

