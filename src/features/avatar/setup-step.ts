// The avatar builder is offered once, straight after someone first signs in: home sends people without an
// avatar there. Remembered for the tab session so someone offline, whose "Skip" couldn't save, isn't sent
// back to it every time they open home. No imports: home is in the first load.

const OFFERED_KEY = 'c40.avatarOffered'

export function avatarStepOffered(): boolean {
  try {
    return sessionStorage.getItem(OFFERED_KEY) === '1'
  } catch {
    return true // Storage blocked: don't risk sending them round in circles
  }
}

export function markAvatarStepOffered() {
  try {
    sessionStorage.setItem(OFFERED_KEY, '1')
  } catch {
    // Nothing to remember it in
  }
}
