import { useParams } from 'react-router'
import { RouteStub } from '@/components/route-stub'

export default function DayRoute() {
  const { n } = useParams()
  return <RouteStub title={`Day ${n ?? ''}`} phase={1} />
}
