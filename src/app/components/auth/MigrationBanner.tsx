import { useState, useCallback } from "react";
import { MigrationService, type MigrationResult } from "../../services/auth/MigrationService";
import { Loader2, Upload, X, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface MigrationBannerProps {
  userId: string;
  documentCount: number;
  onComplete: () => void;
  onDismiss: () => void;
}

export function MigrationBanner({
  userId,
  documentCount,
  onComplete,
  onDismiss,
}: MigrationBannerProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);
    toast.loading("Migrating local documents to your account...", { id: "migration" });

    try {
      const migrationResult = await MigrationService.migrate(userId);
      setResult(migrationResult);

      if (migrationResult.success) {
        toast.success(
          `${migrationResult.migratedCount} document${migrationResult.migratedCount !== 1 ? "s" : ""} migrated to your account.`,
          { id: "migration" }
        );
        setTimeout(onComplete, 1500);
      } else {
        toast.error(
          `Migration completed with ${migrationResult.errors.length} error${migrationResult.errors.length !== 1 ? "s" : ""}.`,
          { id: "migration" }
        );
      }
    } catch (err: any) {
      toast.error("Migration failed. Your local documents are still available.", { id: "migration" });
    } finally {
      setIsMigrating(false);
    }
  }, [userId, onComplete]);

  const handleDismiss = useCallback(() => {
    MigrationService.dismissMigration();
    onDismiss();
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm border border-[#ff3d00]/30 bg-[#111111]/95 backdrop-blur-sm shadow-2xl p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-[#ff3d00] shrink-0" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] font-semibold">
            Local Documents Found
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <X className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Body */}
      {result ? (
        <div className="flex items-start gap-2">
          {result.success ? (
            <CheckCircle className="size-4 text-green-500 shrink-0 mt-0.5" strokeWidth={1.5} />
          ) : (
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {result.success
              ? `${result.migratedCount} document${result.migratedCount !== 1 ? "s" : ""} migrated successfully to your account.`
              : `${result.migratedCount} migrated, ${result.skippedCount} skipped due to errors.`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
            You have{" "}
            <span className="text-foreground font-semibold">{documentCount} local document{documentCount !== 1 ? "s" : ""}</span>{" "}
            from your anonymous session. Would you like to migrate them to your account?
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#ff3d00] hover:bg-[#ff3d00]/90 text-white font-mono text-[9px] uppercase tracking-wider py-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="size-3" strokeWidth={1.5} />
                  Migrate Now
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isMigrating}
              className="px-3 border border-border text-muted-foreground hover:text-foreground font-mono text-[9px] uppercase tracking-wider py-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              Keep Local
            </button>
          </div>
        </>
      )}
    </div>
  );
}
