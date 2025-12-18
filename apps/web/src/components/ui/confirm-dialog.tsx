'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: <Trash2 className="h-6 w-6 text-red-500" />,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      button: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 mx-4">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`p-4 rounded-full ${styles.iconBg} mb-4`}>
                  {styles.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-6">{message}</p>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    className={`flex-1 ${styles.button}`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

