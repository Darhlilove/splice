"use client";

/**
 * FormRecoveryNotification Component
 *
 * Shows a notification when saved form state is detected.
 *
 * Requirements: 7.4
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

interface FormRecoveryNotificationProps {
  onRestore: () => void;
  onDismiss: () => void;
  timestamp?: string;
}

export function FormRecoveryNotification({
  onRestore,
  onDismiss,
  timestamp,
}: FormRecoveryNotificationProps) {
  const timeAgo = timestamp ? new Date(timestamp).toLocaleString() : "recently";

  return (
    <Alert className="mb-4">
      <Icon icon="lucide:info" className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold mb-1">Unsaved Changes Detected</p>
          <p className="text-sm">
            We found form data saved from {timeAgo}. Would you like to restore
            it?
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={onRestore} size="sm">
            <Icon icon="lucide:rotate-ccw" className="w-3 h-3 mr-1" />
            Restore
          </Button>
          <Button onClick={onDismiss} variant="outline" size="sm">
            <Icon icon="lucide:x" className="w-3 h-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
