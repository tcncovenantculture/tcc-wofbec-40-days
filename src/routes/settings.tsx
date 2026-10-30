import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { RouteStub } from '@/components/route-stub'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { useSignOut } from '@/features/auth/api'
import { authErrorMessage } from '@/features/auth/errors'
import { useLocalSettings } from '@/features/settings/use-local-settings'

// Placeholder until Phase 3. It already has text-only mode (Phase 5's toggle, needed to test media) and
// sign out (for testing several accounts on one phone).
export default function SettingsRoute() {
  const signOut = useSignOut()
  const navigate = useNavigate()
  const { textOnly, setTextOnly } = useLocalSettings()

  return (
    <RouteStub title="Settings" phase={3}>
      <div className="space-y-6">
        <Field orientation="horizontal">
          <Checkbox
            id="text-only"
            checked={textOnly}
            onCheckedChange={(checked) => setTextOnly(checked === true)}
            className="mt-1"
          />
          <FieldContent>
            <FieldLabel htmlFor="text-only" className="min-h-6 text-base font-semibold">
              Text only
            </FieldLabel>
            <FieldDescription className="text-base">
              Show pictures, audio and video as text to save data. Turns on by itself when your phone’s data
              saver is on.
            </FieldDescription>
          </FieldContent>
        </Field>

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
      </div>
    </RouteStub>
  )
}
