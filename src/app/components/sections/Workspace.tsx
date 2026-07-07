import { useParams } from "react-router";
import { WorkspaceLayout } from "../workspace/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";

export function Workspace() {
  const { documentId = "document" } = useParams();
  const { user } = useAuth();

  const documentName = decodeURIComponent(documentId)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) + ".pdf";

  return (
    <WorkspaceLayout
      documentName={documentName}
      userName={user?.name ?? "User"}
      userEmail={user?.email ?? "user@evident.ai"}
      userInitials={user?.initials ?? "U"}
    />
  );
}
