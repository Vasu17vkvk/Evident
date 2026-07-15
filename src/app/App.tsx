import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { DocumentProvider } from "./context/DocumentContext";
import { Nav } from "./components/sections/Nav";
import { Hero } from "./components/sections/Hero";
import { Features } from "./components/sections/Features";
import { HowItWorks } from "./components/sections/HowItWorks";
import { About } from "./components/sections/About";
import { Footer } from "./components/sections/Footer";
import { Pricing } from "./components/sections/Pricing";
import { Docs } from "./components/sections/Docs";
import { Blog } from "./components/sections/Blog";
import { SignIn } from "./components/sections/SignIn";
import { Dashboard } from "./components/sections/Dashboard";
import { Account } from "./components/sections/Account";
import { Workspace } from "./components/sections/Workspace";
import { DocumentsPage } from "./components/sections/DocumentsPage";
import { RecentPage } from "./components/sections/RecentPage";
import { FavoritesPage } from "./components/sections/FavoritesPage";
import { NotesPage } from "./components/sections/NotesPage";
import { ExportsPage } from "./components/sections/ExportsPage";
import { StoragePage } from "./components/sections/StoragePage";
import { ProfilePage } from "./components/sections/ProfilePage";
import { SettingsPage } from "./components/sections/SettingsPage";
import { AnalyticsPage } from "./components/sections/AnalyticsPage";
import { Toaster } from "./components/ui/sonner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MigrationBanner } from "./components/auth/MigrationBanner";
import { useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <About />
    </>
  );
}

function AppContent() {
  const { user, showMigrationBanner, pendingMigrationCount, dismissMigrationBanner } = useAuth();

  return (
    <>
      <Routes>
        {/* Standalone full-screen pages */}
        <Route path="/signin" element={<SignIn />} />

        {/* Protected Workspace Layout Routes (No public marketing header/footer) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/workspace/:documentId" element={<Workspace />} />
          <Route path="/workspace" element={<DocumentsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/exports" element={<ExportsPage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/analytics/queries" element={<AnalyticsPage type="queries" />} />
          <Route path="/analytics/citations" element={<AnalyticsPage type="citations" />} />
          <Route path="/analytics/performance" element={<AnalyticsPage type="performance" />} />
        </Route>

        {/* standard pages wrapping header / footer */}
        <Route
          path="/*"
          element={
            <div className="relative min-h-screen bg-background text-foreground">
              {/* Global background grain overlay */}
              <div
                aria-hidden="true"
                className="noise-texture pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
              />

              <Nav />

              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:postId" element={<Blog />} />

                  {/* Protected Cloud Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/account" element={<Account />} />
                  </Route>
                </Routes>
              </main>

              <Footer />
            </div>
          }
        />
      </Routes>

      {/* Global Migration Banner — shown when user logs in with pending local documents */}
      {showMigrationBanner && user && (
        <MigrationBanner
          userId={user.uid}
          documentCount={pendingMigrationCount}
          onComplete={dismissMigrationBanner}
          onDismiss={dismissMigrationBanner}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Toaster position="bottom-right" />
            <AppContent />
          </BrowserRouter>
        </SidebarProvider>
      </DocumentProvider>
    </AuthProvider>
  );
}


