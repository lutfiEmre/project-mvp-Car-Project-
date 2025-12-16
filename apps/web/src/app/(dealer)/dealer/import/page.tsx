'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileJson,
  FileCode,
  Check,
  AlertCircle,
  Download,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setImportResult({
      success: 23,
      failed: 2,
      errors: [
        'Row 5: Missing required field "make"',
        'Row 12: Invalid price format',
      ],
    });
    setImporting(false);
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
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Supported formats: XML, JSON. Maximum file size: 10MB
              </CardDescription>
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
                  onClick={handleImport}
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

