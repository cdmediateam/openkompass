import { getProfile, updateProfile } from '../services/profileService.js'

export const fetchProfile = async (c) => {
  const profile = await getProfile()
  return c.json(profile)
}

export const editProfile = async (c) => {
  const body = await c.req.json()
  const updated = await updateProfile(body)
  return c.json(updated)
}
