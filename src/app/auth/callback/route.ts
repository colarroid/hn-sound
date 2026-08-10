/**
 * Same handler as /auth/confirm. Both paths exist because Supabase's default
 * email templates and its customised ones point at different ones, and a link
 * already sitting in someone's inbox should keep working either way.
 */
export { GET } from "../confirm/route";
