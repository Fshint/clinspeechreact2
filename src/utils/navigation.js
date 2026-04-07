export function getHomeRoute(role) {
  return role === 'patient' ? '/consultations' : '/dashboard';
}
