import { useEffect } from "react";
import { useNavigate } from "react-router";

export function ProfilePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/settings");
  }, [navigate]);

  return null;
}
