import * as bigSmile from '@dicebear/big-smile'
import { createAvatar } from '@dicebear/core'
import { moduleAccents } from '@/theme/tokens'
import type { AvatarChoice } from './options'

// Draws avatars on the phone as SVG data URIs: nothing to download, so they work offline and in text-only
// mode. Each distinct avatar is drawn once and kept, because a pod screen shows the same few many times.

const drawn = new Map<string, string>()

function key(choice: AvatarChoice): string {
  return [
    choice.skin,
    choice.hair,
    choice.hairColour,
    choice.accessory,
    choice.eyes,
    choice.mouth,
    choice.background,
  ].join('|')
}

/** The avatar as an SVG data URI, for an <img>. */
export function avatarDataUri(choice: AvatarChoice): string {
  const k = key(choice)
  const cached = drawn.get(k)
  if (cached) return cached

  const uri = createAvatar(bigSmile, {
    // Every part is chosen below, so the seed changes nothing.
    seed: k,
    skinColor: [choice.skin],
    hair: [choice.hair],
    hairColor: [choice.hairColour],
    accessories: choice.accessory === 'none' ? [] : [choice.accessory],
    accessoriesProbability: choice.accessory === 'none' ? 0 : 100,
    eyes: [choice.eyes],
    mouth: [choice.mouth],
    backgroundColor: [moduleAccents[choice.background].base.replace('#', '')],
  }).toDataUri()

  drawn.set(k, uri)
  return uri
}
