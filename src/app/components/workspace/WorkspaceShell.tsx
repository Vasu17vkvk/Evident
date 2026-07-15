import React, { useState, useEffect } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";

interface WorkspaceShellProps {
  children: React.ReactNode;
  activeId: string;
  // Optional document-specific header props:
  documentName?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onCopilotToggle?: () => void;
  onInsightsToggle?: () => void;
  searchResultsCount?: number;
  activeResultIndex?: number | null;
  onNextResult?: () => void;
  onPrevResult?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  showDocSearch?: boolean;
}

export function WorkspaceShell({
  children,
  activeId,
  documentName,
  searchQuery,
  onSearchChange,
  onCopilotToggle,
  onInsightsToggle,
  searchResultsCount,
  activeResultIndex,
  onNextResult,
  onPrevResult,
  searchInputRef,
  showDocSearch = false,
}: WorkspaceShellProps) {
  const { user } = useAuth();
  
  const { toggle: toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground animate-fade-in">
      {/* Sidebar - Floating overlay drawer */}
      <WorkspaceSidebar
        activeId={activeId}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        {/* Header */}
        <WorkspaceHeader
          documentName={documentName}
          userName={user?.name ?? "User"}
          userEmail={user?.email ?? "user@evident.ai"}
          userInitials={user?.initials ?? "U"}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSidebarToggle={toggleSidebar}
          onCopilotToggle={onCopilotToggle}
          onInsightsToggle={onInsightsToggle}
          searchResultsCount={searchResultsCount}
          activeResultIndex={activeResultIndex}
          onNextResult={onNextResult}
          onPrevResult={onPrevResult}
          searchInputRef={searchInputRef}
          showDocSearch={showDocSearch}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto relative min-h-0 min-w-0 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
