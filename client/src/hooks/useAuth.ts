import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const user = response?.user;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}