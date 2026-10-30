import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { RouteStub } from '@/components/route-stub'
import { Button } from '@/components/ui/button'
import { useSignOut } from '@/features/auth/api'
import { authErrorMessage } from '@/features/auth/errors'

export default function SettingsRoute() {
  const signOut = useSignOut()
  const navigate = useNavigate()

  return (
    <RouteStub title="Settings" phase={3}>
      <Button
        variant="outline"
        className="w-full"
        disabled={signOut.isPending}
        onClick={() =>
          signOut.mutate(undefined, {
            onSuccess: () => void navigate('/', { replace: true }),
            onError: (error) => toast.error(authErrorMessage(error)),
          })
        }
      >
        Sign out
      </Button>
    </RouteStub>
  )
}
